import { DatePipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  SITUACOES_NORMA,
} from '../../shared/normas/norma';
import { validarNorma } from '../../shared/normas/validar-norma';
import { NormaDocumento } from '../../shared/components/norma-documento/norma-documento';
import { CATEGORIAS } from '../search/filtro-busca';
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
  imports: [DatePipe, JsonPipe, ReactiveFormsModule, RouterLink, EditorConteudo, NormaDocumento],
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
  readonly estruturado = !this.original || !!this.original.estruturada;
  readonly id = this.original?.norma.id ?? novoId('norma');
  readonly categorias = CATEGORIAS;
  readonly situacoes = SITUACOES_NORMA;
  readonly etapa = signal(1);
  readonly erro = signal('');
  readonly conteudo = signal<readonly ConteudoNorma[]>(this.original?.estruturada?.conteudo ?? []);
  readonly revisao = signal<RegistroAcervo | null>(null);
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
  readonly texto = this.fb.control(this.original?.norma.texto ?? '', [
    Validators.required,
    Validators.maxLength(200_000),
  ]);
  readonly preambulo = this.fb.control(this.original?.norma.preambulo ?? '');
  readonly assinaturas = this.fb.control(this.original?.norma.assinaturas.join('\n') ?? '');

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
    this.revisao.set(null);
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
      norma: {
        ...this.original!.norma,
        identificacao,
        categoria: especie,
        epigrafe,
        ementa,
        dataAto,
        situacao,
        fontes,
        publicacoes,
        dataPublicacao: publicacoes[0]?.data ?? (dataPublicacaoLegada || null),
        texto: this.texto.value,
        preambulo: this.preambulo.value,
        assinaturas: this.assinaturas.value.split(/\r?\n/).filter((linha) => linha.trim()),
        leitura: undefined,
      },
    };
  }

  revisar(): void {
    if (!this.validarInformacoes()) {
      this.etapa.set(1);
      return;
    }
    if (
      this.estruturado ? !this.conteudo().length : this.texto.invalid || !this.texto.value.trim()
    ) {
      this.erro.set(
        this.estruturado
          ? 'Adicione pelo menos um elemento ao conteúdo.'
          : 'Informe o texto dos dispositivos (até 200.000 caracteres).',
      );
      return;
    }
    try {
      this.revisao.set(this.montarRegistro());
      this.erro.set('');
      this.etapa.set(3);
    } catch (erro) {
      this.erro.set(erro instanceof Error ? erro.message : 'Não foi possível revisar o documento.');
    }
  }
  salvar(): void {
    if (this.etapa() !== 3 || !this.revisao()) return;
    try {
      this.acervo.salvarMock(this.revisao()!, this.idExistente);
      void this.router.navigate(['/normas', this.id]);
    } catch (erro) {
      this.erro.set(erro instanceof Error ? erro.message : 'Não foi possível salvar.');
    }
  }
}
