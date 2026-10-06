import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Editor, Extension, JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import UniqueID from '@tiptap/extension-unique-id';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as EditorNode } from '@tiptap/pm/model';
import {
  ElementoEditor,
  TIPOS_EDITOR,
  idEditor,
  interpretarDocumentoEditor,
  textoDoEditor,
} from '../../shared/normas/documento-editor';
import { normalizarColagem } from './colar-editor';

const chave = new PluginKey<{ decoracoes: DecorationSet; elementos: ElementoEditor[] }>('norma');
function destacar(doc: EditorNode) {
  const json = doc.toJSON();
  const analise =
    textoDoEditor(json).length > 200_000 ? { elementos: [] } : interpretarDocumentoEditor(json);
  const mapa = new Map(analise.elementos.map((elemento) => [elemento.id, elemento]));
  const decoracoes: Decoration[] = [];
  doc.forEach((no, posicao) => {
    const elemento = mapa.get(no.attrs['id']);
    if (!elemento) return;
    decoracoes.push(
      Decoration.node(posicao, posicao + no.nodeSize, {
        class: `elemento-norma tipo-${elemento.tipo}${elemento.vazio ? ' elemento-vazio' : ''}`,
        'data-tipo-norma': elemento.tipo,
        'data-origem': elemento.origem,
        'data-rotulo': `${elemento.nome}${elemento.origem === 'manual' ? ' · manual' : ''}`,
        'data-unidade': elemento.unidadeId,
      }),
    );
  });
  return { decoracoes: DecorationSet.create(doc, decoracoes), elementos: analise.elementos };
}
const SemanticaNorma = Extension.create({
  name: 'semanticaNorma',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          normaTipo: { default: null, rendered: false, parseHTML: () => null },
          normaGrupo: { default: null, rendered: false, parseHTML: () => null },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: chave,
        state: {
          init: (_, estado) => destacar(estado.doc),
          apply: (tr, valor) => (tr.docChanged ? destacar(tr.doc) : valor),
        },
        props: { decorations: (estado) => chave.getState(estado)?.decoracoes },
      }),
    ];
  },
});

@Component({
  selector: 'app-editor-continuo',
  templateUrl: './editor-continuo.html',
  styleUrl: './editor-continuo.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorContinuo implements AfterViewInit, OnDestroy {
  readonly documento = input.required<JSONContent>();
  readonly alterar = output<JSONContent>();
  private readonly superficie = viewChild.required<ElementRef<HTMLElement>>('superficie');
  readonly tipos = TIPOS_EDITOR;
  readonly ativo = signal('Texto livre');
  readonly origem = signal('');
  readonly emTabela = signal(false);
  readonly selecao = signal('');
  readonly revisao = signal(0);
  readonly feedback = signal('');
  editor?: Editor;

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.superficie().nativeElement,
      extensions: [
        StarterKit.configure({
          bulletList: false,
          orderedList: false,
          listItem: false,
          listKeymap: false,
          blockquote: false,
          codeBlock: false,
          code: false,
          horizontalRule: false,
          link: { openOnClick: false, autolink: false },
        }),
        TableKit.configure({ table: { resizable: false } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        UniqueID.configure({
          types: ['paragraph', 'heading', 'table', 'tableRow', 'tableCell', 'tableHeader'],
          generateID: idEditor,
        }),
        SemanticaNorma,
      ],
      content: this.documento(),
      enableInputRules: false,
      enablePasteRules: false,
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': 'Texto da norma',
          'aria-multiline': 'true',
          'aria-describedby': 'ajuda-editor-continuo',
          lang: 'pt-BR',
          spellcheck: 'true',
        },
        transformPastedHTML: normalizarColagem,
      },
      onCreate: () => {
        this.emitir();
        this.atualizarSelecao();
      },
      onUpdate: () => {
        this.emitir();
        this.atualizarSelecao();
      },
      onSelectionUpdate: () => this.atualizarSelecao(),
      onTransaction: () => this.revisao.update((valor) => valor + 1),
    });
  }
  ngOnDestroy(): void {
    this.editor?.destroy();
  }
  private emitir(): void {
    if (this.editor) this.alterar.emit(this.editor.getJSON());
  }
  private atualizarSelecao(): void {
    if (!this.editor) return;
    const estado = this.editor.state;
    const raiz = estado.selection.$from.depth ? estado.selection.$from.node(1) : undefined;
    const elemento = chave.getState(estado)?.elementos.find((e) => e.id === raiz?.attrs['id']);
    this.ativo.set(elemento?.nome ?? 'Texto livre');
    this.origem.set(
      elemento?.origem === 'manual' ? 'Classificação manual' : 'Reconhecimento automático',
    );
    this.emTabela.set(this.editor.isActive('table'));
    this.selecao.set(raiz?.attrs['normaTipo'] ?? '');
  }
  classificar(tipo: string, separar = false): void {
    if (!this.editor || this.emTabela()) return;
    const { state, view } = this.editor;
    const tr = state.tr;
    const grupo = idEditor();
    state.doc.nodesBetween(state.selection.from, state.selection.to, (no, posicao, pai) => {
      if (pai?.type.name !== 'doc' || !no.isTextblock) return;
      const automatico = chave
        .getState(state)
        ?.elementos.find((e) => e.id === no.attrs['id'])?.tipo;
      const anterior = no.attrs['normaTipo'];
      const tipoSeparado =
        anterior && anterior !== 'continuacao'
          ? anterior
          : automatico === 'titulo'
            ? 'texto'
            : (automatico ?? 'texto');
      tr.setNodeMarkup(posicao, undefined, {
        ...no.attrs,
        normaTipo: separar ? tipoSeparado : tipo || null,
        normaGrupo: tipo || separar ? (separar ? idEditor() : grupo) : null,
      });
    });
    view.dispatch(tr);
    this.editor.commands.focus();
    this.feedback.set(
      separar
        ? 'Elementos separados. A classificação foi mantida.'
        : tipo
          ? 'Classificação aplicada. Você pode continuar escrevendo.'
          : 'Reconhecimento automático restaurado.',
    );
  }
  formatar(tipo: 'bold' | 'italic' | 'underline'): void {
    this.editor?.chain().focus().toggleMark(tipo).run();
  }
  marcado(tipo: string): boolean {
    this.revisao();
    return this.editor?.isActive(tipo) ?? false;
  }
  desfazer(): void {
    this.editor?.chain().focus().undo().run();
  }
  refazer(): void {
    this.editor?.chain().focus().redo().run();
  }
  inserirTabela(): void {
    this.editor?.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run();
  }
  tabela(
    acao:
      | 'addRowAfter'
      | 'deleteRow'
      | 'addColumnAfter'
      | 'deleteColumn'
      | 'mergeCells'
      | 'splitCell'
      | 'deleteTable',
  ): void {
    const comandos = this.editor?.chain().focus();
    comandos?.[acao]().run();
  }
}
