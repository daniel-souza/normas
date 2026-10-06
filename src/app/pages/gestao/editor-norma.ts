import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Acervo, RegistroAcervo } from '../../shared/normas/acervo';
import { adaptarNorma } from '../../shared/normas/adaptar-norma';
import { ConteudoNorma, NormaEstruturada } from '../../shared/normas/conteudo-norma';
import {
  CategoriaNorma,
  FonteNorma,
  PublicacaoNorma,
  SituacaoNorma,
} from '../../shared/normas/norma';
import type { JSONContent } from '@tiptap/core';
import {
  documentoDeTexto,
  interpretarDocumentoEditor,
  textoDoEditor,
} from '../../shared/normas/documento-editor';
import { EditorContinuo } from './editor-continuo';
import { validarNorma } from '../../shared/normas/validar-norma';
import { NormaDocumento } from '../../shared/components/norma-documento/norma-documento';
import { CATEGORIAS, dataCivil } from '../search/filtro-busca';
import { EditorConteudo, novoId } from './editor-conteudo';

const obrigatorio = [Validators.required, Validators.pattern(/\S/)];
const dataCivilValida = (controle: { value: string }) => {
  const valor = controle.value;
  if (!valor) return null;
  const data = new Date(`${valor}T12:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === valor
    ? null
    : { data: true };
};
const urlFonteValida = (controle: { value: string }) => {
  try {
    const url = new URL(controle.value);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return null;
  } catch {
    /* Retorna a mesma mensagem de validação. */
  }
  return { url: true };
};

@Component({
  selector: 'app-editor-norma',
  imports: [ReactiveFormsModule, RouterLink, EditorConteudo, EditorContinuo, NormaDocumento],
  templateUrl: './editor-norma.html',
  styleUrl: './editor-norma.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorNorma {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly acervo = inject(Acervo);
  private readonly router = inject(Router);
  readonly idExistente = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? undefined;
  readonly original = this.idExistente ? this.acervo.obter(this.idExistente) : undefined;
  readonly ausente = !!this.idExistente && !this.original;
  readonly estruturado = !!this.original?.estruturada;
  readonly id = this.original?.norma.id ?? novoId('norma');
  readonly categorias = CATEGORIAS;
  readonly etapa = signal(1);
  readonly erro = signal('');
  readonly conteudo = signal<readonly ConteudoNorma[]>(this.original?.estruturada?.conteudo ?? []);
  readonly fontes = this.fb.array<ReturnType<EditorNorma['grupoFonte']>>([]);
  readonly publicacoes = this.fb.array<ReturnType<EditorNorma['grupoPublicacao']>>([]);
  readonly formulario = this.fb.group({
    orgao: ['', obrigatorio],
    especie: this.fb.control<CategoriaNorma>('Portaria', Validators.required),
    numero: ['', obrigatorio],
    ano: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(1), Validators.max(9999), Validators.pattern(/^\d+$/)],
    ],
    dataAto: ['', [Validators.required, dataCivilValida]],
    epigrafe: ['', obrigatorio],
    titulo: [''],
    ementa: ['', obrigatorio],
    processo: [''],
    situacao: this.fb.control<SituacaoNorma>('nao_verificada', Validators.required),
    fontes: this.fontes,
    publicacoes: this.publicacoes,
    dataPublicacaoLegada: ['', dataCivilValida],
  });
  readonly documento = signal<JSONContent>(
    this.original?.editor?.documento ?? documentoDeTexto(this.original?.norma.texto ?? ''),
  );
  readonly preambulo = this.fb.control<string>(this.original?.norma.preambulo ?? '');
  readonly assinaturas = this.fb.control<string>(this.original?.norma.assinaturas.join('\n') ?? '');
  readonly limite = 200_000;
  readonly textoAtual = computed(() => textoDoEditor(this.documento()));
  private readonly preambuloAtual = toSignal<string, string>(this.preambulo.valueChanges, {
    initialValue: this.preambulo.value,
  });
  private readonly assinaturasAtuais = toSignal<string, string>(this.assinaturas.valueChanges, {
    initialValue: this.assinaturas.value,
  });
  private readonly dadosAtuais = toSignal(this.formulario.valueChanges);
  readonly limiteExcedido = computed(() => this.textoAtual().length > this.limite);
  readonly analise = computed(() =>
    interpretarDocumentoEditor(
      this.limiteExcedido() ? { type: 'doc', content: [] } : this.documento(),
    ),
  );
  readonly leituraTexto = computed(() => this.analise().leitura);
  atualizarDocumento(documento: JSONContent): void {
    this.documento.set(documento);
    this.erro.set('');
  }
  readonly previa = computed(() => {
    this.dadosAtuais();
    return this.montarRegistro().norma;
  });
  readonly reconhecidos = computed(() => {
    const blocos = this.previa().leitura?.blocos ?? [];
    const tipos = [
      ['agrupamento', 'agrupamento', 'agrupamentos'],
      ['artigo', 'artigo', 'artigos'],
      ['paragrafo', 'parágrafo', 'parágrafos'],
      ['inciso', 'inciso', 'incisos'],
      ['alinea', 'alínea', 'alíneas'],
      ['item', 'item', 'itens'],
    ];
    return tipos
      .flatMap(([tipo, singular, plural]) => {
        const quantidade = blocos.filter((bloco) => bloco.tipo === tipo).length;
        return quantidade ? [`${quantidade} ${quantidade === 1 ? singular : plural}`] : [];
      })
      .join(' · ');
  });

  constructor() {
    const norma = this.original?.norma;
    if (!norma) return;
    this.formulario.patchValue({
      ...norma.identificacao,
      especie: norma.categoria,
      epigrafe: norma.epigrafe,
      ementa: norma.ementa,
      situacao: norma.situacao,
      dataAto: norma.dataAto ?? '',
      dataPublicacaoLegada: norma.dataPublicacao ?? '',
    });
    for (const fonte of norma.fontes ?? []) this.adicionarFonte(fonte);
    for (const publicacao of norma.publicacoes ?? []) this.adicionarPublicacao(publicacao);
  }

  private grupoFonte(fonte?: FonteNorma) {
    return this.fb.group({
      id: [fonte?.id ?? novoId('fonte')],
      descricao: [fonte?.descricao ?? '', obrigatorio],
      url: [fonte?.url ?? '', [Validators.required, urlFonteValida]],
    });
  }
  private grupoPublicacao(publicacao?: PublicacaoNorma) {
    return this.fb.group({
      veiculo: [publicacao?.veiculo ?? '', obrigatorio],
      data: [publicacao?.data ?? '', [Validators.required, dataCivilValida]],
      fonteId: [
        publicacao?.fonteId ?? this.fontes.at(0)?.controls.id.value ?? '',
        Validators.required,
      ],
      edicao: [publicacao?.edicao ?? ''],
      secao: [publicacao?.secao ?? ''],
      pagina: [publicacao?.pagina ?? ''],
    });
  }
  adicionarFonte(fonte?: FonteNorma): void {
    this.fontes.push(this.grupoFonte(fonte));
  }
  adicionarPublicacao(publicacao?: PublicacaoNorma): void {
    this.publicacoes.push(this.grupoPublicacao(publicacao));
  }
  fonteEmUso(id: string): boolean {
    return this.publicacoes.controls.some((p) => p.controls.fonteId.value === id);
  }
  removerFonte(indice: number): void {
    if (!this.fonteEmUso(this.fontes.at(indice).controls.id.value)) this.fontes.removeAt(indice);
  }
  private validarInformacoes(): boolean {
    this.formulario.markAllAsTouched();
    const ids = new Set(this.fontes.getRawValue().map((f) => f.id));
    if (
      this.formulario.invalid ||
      this.publicacoes.getRawValue().some((p) => !ids.has(p.fonteId))
    ) {
      this.erro.set(
        'Preencha os campos obrigatórios e confira datas, URLs e a fonte de cada publicação.',
      );
      return false;
    }
    this.erro.set('');
    return true;
  }
  continuar(): void {
    if (this.validarInformacoes()) this.etapa.set(2);
  }
  voltar(etapa: number): void {
    this.erro.set('');
    this.etapa.set(etapa);
  }

  private montarRegistro(): RegistroAcervo {
    const {
      orgao,
      especie,
      numero,
      ano,
      dataAto,
      epigrafe,
      titulo,
      ementa,
      processo,
      situacao,
      fontes,
      publicacoes,
      dataPublicacaoLegada,
    } = this.formulario.getRawValue();
    const identificacao = {
      orgao,
      especie,
      numero,
      ano: Number(ano),
      dataAto,
      epigrafe,
      titulo,
      ementa,
      processo,
    };
    if (this.estruturado) {
      const data = new Date();
      const hoje = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      const estruturada: NormaEstruturada = {
        ...this.original?.estruturada,
        versaoSchema: '1.0.0',
        tipo: 'norma',
        id: this.id,
        identificacao,
        situacao,
        fontes,
        publicacoes,
        extracao: this.original?.estruturada?.extracao ?? {
          data: hoje,
          metodo: 'manual',
          htmlOriginalObtido: false,
          layoutTabelas: JSON.stringify(this.conteudo()).includes('"tipo":"tabela"')
            ? 'normalizado'
            : 'nao_se_aplica',
          observacoes: ['Cadastro manual de demonstração; sem publicação no servidor.'],
        },
        conteudo: this.conteudo(),
      };
      return { estruturada, norma: adaptarNorma(validarNorma(estruturada)) };
    }
    return {
      editor: { versao: 1, documento: this.documento() },
      norma: {
        ...this.original?.norma,
        id: this.id,
        demonstracao: this.original?.norma.demonstracao ?? false,
        extracao: this.original?.norma.extracao ?? {
          data: dataCivil(new Date()),
          metodo: 'manual',
          htmlOriginalObtido: false,
          layoutTabelas: this.leituraTexto().blocos.some((bloco) => bloco.tipo === 'tabela')
            ? 'normalizado'
            : 'nao_se_aplica',
          observacoes: [
            'Documento inserido no editor contínuo; classificações automáticas e manuais, formatação e tabelas preservadas no rascunho.',
          ],
        },
        identificacao,
        categoria: especie,
        epigrafe,
        ementa,
        dataAto,
        situacao,
        fontes,
        publicacoes,
        dataPublicacao: publicacoes[0]?.data ?? (dataPublicacaoLegada || null),
        texto: this.textoAtual(),
        preambulo: this.preambuloAtual(),
        assinaturas: this.assinaturasAtuais()
          .split(/\r?\n/)
          .filter((linha) => linha.trim()),
        leitura: this.leituraTexto(),
      },
    };
  }

  salvar(): void {
    if (this.etapa() !== 2) return;
    if (!this.validarInformacoes()) {
      this.etapa.set(1);
      return;
    }
    if (
      this.estruturado
        ? !this.conteudo().length
        : this.limiteExcedido() ||
          (!this.textoAtual().trim() &&
            !this.documento().content?.some((no) => no.attrs?.['normaTipo'] || no.type === 'table'))
    ) {
      this.erro.set(
        this.estruturado
          ? 'O documento precisa ter conteúdo.'
          : 'Cole ou digite o texto, ou classifique um elemento vazio (até 200.000 caracteres).',
      );
      return;
    }
    try {
      this.acervo.salvarMock(this.montarRegistro(), this.idExistente);
      void this.router.navigate(['/normas', this.id]);
    } catch (erro) {
      this.erro.set(erro instanceof Error ? erro.message : 'Não foi possível salvar.');
    }
  }
}
