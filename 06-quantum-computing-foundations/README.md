# S6 — Quantum Computing Foundations

| | |
|---|---|
| **Data** | 30 de abril de 2026 |
| **Instrutora** | Milica ([@0xMilica](https://x.com/0xMilica)) |
| **Duração** | 1h23 |
| **Vídeo** | https://www.youtube.com/watch?v=RoYL_Lx3CCA |
| **Slides** | _enviados pela instrutora — pendentes_ |
| **Leitura sugerida** | _Yanofsky & Mannucci — Quantum Computing for Computer Scientists (livro inteiro, ~400 pp)_ |
| **Transcrição crua** | [`transcript-raw.md`](./transcript-raw.md) |

> ⚠️ **Mudança de agenda.** A grade original previa *Semaphore Protocol* nesta data. A instrutora trocou por uma **aula surpresa de fundamentos de Computação Quântica** ("I've never had this lesson before — you're the first group to listen to it"). Semaphore foi cortado da grade desta cohort — fica para a edição avançada de setembro.

> Aula deliberadamente *overview*, não deep dive: o objetivo é dar contexto suficiente para entender **por que** o algoritmo de Shor ameaça a criptografia de chave pública atual, e **por que** ainda não estamos sob ataque agora.

---

## Notas estruturadas da aula

### 1. Motivação — por que falar disso num curso de ZK?

Toda a criptografia de chave pública moderna (RSA, ECC, Diffie-Hellman) repousa em **funções one-way**: fácil multiplicar, difícil fatorar; fácil exponenciar numa curva, difícil tomar log discreto. Em hardware clássico, quebrar 2048-bit RSA leva tempo galáctico. Em **hardware quântico estável e suficientemente grande**, leva tempo polinomial — **algoritmo de Shor (1994)**.

Consequência prática:

| Frente | Status hoje |
|---|---|
| Hardware quântico para Shor real | IBM ~1.000 qubits, instáveis, perto do zero absoluto. **Insuficiente.** |
| "Harvest now, decrypt later" | Adversários estão **interceptando e arquivando** tráfego cifrado *agora* para descriptografar quando o quantum maturar. |
| Pós-quantum cryptography (PQC) | NIST padronizou Kyber (KEM) e Dilithium (assinatura) em 2024. Já em deploy. |
| Zero-knowledge | SNARKs baseados em pairings (KZG, Groth16) **caem com Shor**. STARKs (FRI/hash-based) **resistem**. |

### 2. Modelo matemático — por que números complexos?

A unidade central do quantum computing é o **qubit**. Um qubit não é "0 ou 1": é uma **superposição linear** das duas bases:

```
|ψ⟩ = α|0⟩ + β|1⟩       com  α, β ∈ ℂ  e  |α|² + |β|² = 1
```

`α` e `β` são **amplitudes complexas**. Por que complexas e não reais?

- **Fase importa.** Dois estados com mesma probabilidade (`|α|²` igual) mas fases diferentes interagem de forma diferente — isso permite **interferência destrutiva e construtiva**, que é a força do quantum.
- Origem: `i² = −1` resolve `x² + 1 = 0`, equação que não tem raízes reais. A fase do qubit é o ângulo no plano complexo.

Representação polar:

```
α = r · e^(iθ)
    │     │
    │     └── fase  (ângulo)
    └────── amplitude (módulo)
```

> O exemplo do quadro: vetor com lados 3 e 4 → comprimento 5 (Pitágoras). Em quantum, comprimento corresponde a **amplitude**, ângulo a **fase**. Quase sempre normalizamos: comprimento total = 1.

### 3. Bit vs Qubit — a tabela essencial

| | Bit clássico | Qubit |
|---|---|---|
| Estado | 0 **ou** 1 | `α│0⟩ + β│1⟩` (superposição) |
| Espaço | {0, 1} | esfera unitária em ℂ² (esfera de Bloch) |
| Medição | só lê o valor | **colapsa** o estado para 0 (com prob `│α│²`) ou 1 (com prob `│β│²`) |
| n unidades | 2ⁿ valores possíveis, **um por vez** | superposição de **todos** os 2ⁿ ao mesmo tempo |
| Operações | AND, OR, NOT (irreversíveis) | gates **unitários** (sempre reversíveis) |

> ⚠️ Não é "o qubit é 0 e 1 ao mesmo tempo" no sentido jornalístico. É: o qubit *carrega informação* sobre as duas bases simultaneamente, mas qualquer **medição** força colapso para um único bit clássico. Você não consegue ler o qubit duas vezes para extrair informação extra.

### 4. Superposição — analogia da moeda girando

A analogia que a instrutora deu no Q&A: imagine uma moeda **girando** em pé. Enquanto gira, não é cara nem coroa — é um estado intermediário com probabilidades. Quando você para a moeda (mede), ela colapsa em um lado. *Antes* de medir, a moeda *carrega* informação sobre ambos os lados ao mesmo tempo.

### 5. Entanglement (entrelaçamento)

Dois (ou mais) qubits podem ser preparados num estado em que medir um **instantaneamente** determina o outro, mesmo separados. Estado clássico de Bell:

```
|Φ⁺⟩ = (|00⟩ + |11⟩) / √2
```

Medir o primeiro qubit → 0 com 50% (e o segundo vira 0) **ou** 1 com 50% (e o segundo vira 1). Os dois resultados são **perfeitamente correlacionados**.

Por que importa para Shor & cia: algoritmos quânticos exploram entanglement para criar **interferência massiva** entre todos os 2ⁿ caminhos paralelos da superposição, amplificando a resposta certa e cancelando as erradas.

### 6. Vetores, matrizes e gates

O ferramental matemático:

| Objeto | Papel |
|---|---|
| **Vetor complexo** em ℂ^(2ⁿ) | estado de n qubits |
| **Produto interno** `⟨ψ│φ⟩` | probabilidade de transição entre estados |
| **Produto tensor** `│ψ⟩ ⊗ │φ⟩` | combina sistemas independentes — base da exponencialidade |
| **Matriz unitária** U (U†U = I) | gate quântico (preserva norma → reversível) |
| **Matriz hermitiana** (H = H†) | observável (autovalores reais = resultados de medição) |
| **Identidade I** | "não faz nada" |
| **Hadamard H** | leva │0⟩ → (│0⟩ + │1⟩)/√2 → cria superposição uniforme |

Notação **bra-ket** (Dirac): `│ψ⟩` é vetor coluna ("ket"), `⟨ψ│` é vetor linha conjugado ("bra").

### 7. Algoritmo de Shor — visão de alto nível

Objetivo: dado `N = p·q` (composto grande), achar `p` e `q`.

**Idea-chave:** fatorar reduz a achar a **ordem** `r` de um inteiro `a` mod `N` — o menor `r` tal que `a^r ≡ 1 (mod N)`. Encontrado `r`, fatores saem por `gcd(a^(r/2) ± 1, N)`.

| Passo | Onde roda | Custo |
|---|---|---|
| Escolher `a` random, checar `gcd(a, N) = 1` | clássico | trivial |
| Achar a ordem `r` de `a` mod `N` | **quântico** (período-finding via QFT) | **polinomial** |
| `gcd(a^(r/2) ± 1, N)` → fatores | clássico | polinomial |

A mágica está no passo 2:
1. Cria-se superposição de **todos** os `x ∈ {0, …, 2ⁿ−1}` em paralelo.
2. Calcula-se `f(x) = a^x mod N` para todos eles simultaneamente (entanglement).
3. Aplica-se **Quantum Fourier Transform (QFT)** sobre o registrador: a QFT extrai a **frequência** (= período `r`) do padrão de `f`.
4. Mede-se: com alta probabilidade, sai um múltiplo de `1/r` — clássico recupera `r`.

Comparação:

| Algoritmo | Complexidade |
|---|---|
| Crivo de número geral (clássico, melhor conhecido) | sub-exponencial: `exp((log N)^(1/3))` |
| **Shor (quântico)** | **polinomial: `O((log N)³)`** |

> Para `N` de 2048 bits: clássico levaria milhares de anos; Shor com hardware suficiente, horas.

### 8. QFT como "FFT quântico"

A FFT clássica decompõe um sinal em frequências. A **Quantum Fourier Transform** faz o mesmo, mas:

- Opera em **amplitudes** (não em valores de amostra).
- Faz `O(n²)` gates em vez de `O(n · 2ⁿ)` operações da FFT clássica — exponencialmente mais rápido.
- O resultado fica codificado em superposição: você só lê *um* sample por execução, mas com a estrutura do período já presente.

Analogia da aula: *"é como tentar achar o batimento de um inteiro grande, em vez de quebrá-lo pedaço por pedaço."*

### 9. Por que ainda não estamos sob ataque

Três barreiras de hardware, **todas** precisam cair:

| Barreira | Estado-da-arte | Necessário para quebrar RSA-2048 |
|---|---|---|
| Número de qubits físicos | ~1.000 (IBM, 2024) | ~20 milhões (com correção de erro) |
| Tempo de coerência | microsegundos a millisegundos | precisa rodar o circuito Shor inteiro antes de decoerir |
| Temperatura | ~milikelvin (perto do zero absoluto) | mesma — escala mal |
| Correção de erro | ainda imatura | **logical qubits** custam ~1.000 qubits físicos cada |

Por isso *Shor real* contra RSA-2048 é estimado para **2030–2040** (intervalo amplo).

### 10. Recursos pós-quantum (PQC)

| Familia | Exemplo padronizado (NIST 2024) | Base matemática |
|---|---|---|
| Lattice-based | **Kyber** (KEM), **Dilithium** (assinatura) | shortest vector problem |
| Hash-based | **SPHINCS+** (assinatura) | resistência de hashes |
| Code-based | Classic McEliece | decodificação de códigos |
| Multivariate | (não selecionado em 2024) | sistemas polinomiais |

Para zero-knowledge:

| Sistema | Quantum-safe? | Por quê |
|---|---|---|
| Groth16, KZG, PLONK | ❌ | dependem de pairings em curvas elípticas (cai com Shor) |
| **STARKs** (FRI) | ✅ | só hashes — quebrá-los exige Grover (apenas √ speedup) |
| Bulletproofs (IPA) | ❌ | log discreto (cai com Shor) |

---

## Walkthrough — qubit em uma página

```
                       │1⟩
                        │
                        │
        ┌───── │ψ⟩ = α│0⟩ + β│1⟩
        │      │      onde α,β ∈ ℂ
        │      │            │α│² + │β│² = 1
        │      │
        │      θ           ── medir ──>  0 com prob │α│²
        │      │                          1 com prob │β│²
────────┼──────●──────── │0⟩
        │
                                ESFERA DE BLOCH
                                (superfície de uma esfera unitária)


  GATES BÁSICOS (1 qubit)            GATES MULTI-QUBIT
  ──────────────────────             ────────────────────
  Identity I  =  [1 0]               CNOT (controle + alvo)
                 [0 1]               cria entanglement entre 2 qubits

  Pauli-X (NOT)  [0 1]               Toffoli (3 qubits)
                 [1 0]               base universal junto com Hadamard

  Hadamard H = (1/√2) [1  1]
                       [1 −1]
   │0⟩ ─H─ (│0⟩ + │1⟩)/√2  ← superposição

  Phase Z   = [1  0]
              [0 −1]   ← rotaciona fase relativa


  ALGORITMO DE SHOR (esqueleto)
  ─────────────────────────────
   ┌──────────────┐   ┌─────┐   ┌─────┐   ┌──────┐
   │ inicializar  │ → │ H⊗n │ → │ U_f │ → │ QFT⁻¹│ → medir
   │  │00…0⟩      │   │super│   │a^x  │   │      │       │
   └──────────────┘   │posiç│   │mod N│   └──────┘       ▼
                     └─────┘    └─────┘                período r
                                                       │
                                                  clássico
                                                       │
                                                  fatores p, q
```

---

## Comentários técnicos e correções

1. **Pausa no contexto: Semaphore foi cortado.** A pasta original deste módulo (`06-semaphore-protocol/`) foi renomeada para `06-quantum-computing-foundations/` para refletir a aula de fato dada. A instrutora confirmou em aula que a próxima sessão é com **Logos**, não Semaphore. Quem quiser estudar Semaphore por conta própria: [docs.semaphore.pse.dev](https://docs.semaphore.pse.dev/).

2. **A aula admitiu lacunas.** Frase literal: *"no matter what I have read, it still leaves some gaps. The more you read, the more you're puzzled — especially the nature of the particles."* Isso é honesto: quantum mechanics ainda é interpretacionalmente aberta. Para o escopo "quero entender Shor", essas lacunas filosóficas não bloqueiam.

3. **Pergunta do Yura ficou meio respondida.** Ele perguntou *qual a conexão entre superposição e números complexos*. A resposta correta: amplitudes são complexas porque precisamos modelar **fase** (não só probabilidade). Probabilidade clássica usa números reais ∈ [0,1]. Probabilidade quântica usa **amplitudes complexas** cujo módulo ao quadrado dá a probabilidade — a fase, perdida no quadrado, ainda governa a interferência entre estados.

4. **`|α|² + |β|² = 1` é a normalização.** Não foi falado com esta clareza na aula. É a versão quântica de "as probabilidades somam 1".

5. **Não-clonagem (No-cloning theorem) — omitido.** É uma propriedade essencial: você **não pode** copiar um qubit desconhecido. Isso é o que viabiliza **Quantum Key Distribution (BB84)** — qualquer espião que tente interceptar perturba o estado e é detectado. Vale leitura à parte.

6. **Heisenberg foi mencionado de raspão.** Princípio: para certos pares de observáveis (posição/momento, ou medição em bases não-comutantes), você **não pode** medir ambos com precisão arbitrária. Em quantum computing isso aparece quando você escolhe em que **base** medir — bases diferentes dão informações incompatíveis.

7. **"IBM ~1.000 qubits" ≠ Shor-ready.** Esses são qubits **físicos**, não **lógicos**. Um qubit lógico tolerante a falhas custa ~1.000 físicos via códigos de superfície. Para fatorar RSA-2048 precisa-se de ~4.000 qubits **lógicos** = ~20M físicos. Status real: ainda nem chegamos a 1 qubit lógico estável.

8. **Algoritmo de Grover (não citado) é o "outro Shor".** Para **busca não-estruturada**, Grover dá **quadratic speedup** (`O(√N)` vs `O(N)`). Implicação prática: chaves simétricas precisam **dobrar** de tamanho (AES-128 → AES-256) para manter o mesmo nível de segurança contra Grover. Hashes idem. STARKs estão protegidos *o suficiente* porque seu nível de segurança absorve o √ de Grover.

9. **Conexão direta com este curso.** Sistemas SNARK que estamos vendo:

   | Sistema | Vimos em | Quantum-safe? |
   |---|---|---|
   | RSA "toy" | S2 + projeto attendance | ❌ (Shor) |
   | Diffie-Hellman | S2 | ❌ (Shor) |
   | KZG + pairings | S4 | ❌ (Shor — pairings caem) |
   | Circom + Groth16/PLONK | S5 | ❌ (Shor — discrete log) |
   | STARKs (não vistos ainda) | — | ✅ (apenas Grover) |

   Implicação: se você está construindo algo com horizonte > 10 anos, considere STARKs ou stacks pós-quantum.

10. **"Computer scientists" do livro recomendado é o ponto de entrada certo.** Yanofsky & Mannucci — *Quantum Computing for Computer Scientists* (2008) — assume álgebra linear básica e não pula a matemática. Há uma versão draft em PDF flutuando no GitHub. Próxima leitura natural: Nielsen & Chuang ("Mike & Ike") — bíblia, mais denso.

**Leituras complementares:**

- [Yanofsky & Mannucci — Quantum Computing for Computer Scientists](https://www.cambridge.org/core/books/quantum-computing-for-computer-scientists/8AEA723BEE5CC9F5C03FDD4BA850C711) — recomendado pela instrutora
- [Nielsen & Chuang — Quantum Computation and Quantum Information](https://www.cambridge.org/highereducation/books/quantum-computation-and-quantum-information/) — referência canônica
- [Scott Aaronson — Lecture Notes "Quantum Computing Since Democritus"](https://www.scottaaronson.com/democritus/) — perspectiva CS, leitura ágil
- [Shor (1994) — Algorithms for quantum computation: discrete logarithms and factoring](https://arxiv.org/abs/quant-ph/9508027) — paper original
- [NIST — Post-Quantum Cryptography Standardization](https://csrc.nist.gov/projects/post-quantum-cryptography) — Kyber, Dilithium, SPHINCS+
- [Quantum.country — Andy Matuschak & Michael Nielsen](https://quantum.country/) — primer interativo com spaced repetition
- [IBM Quantum — Qiskit Textbook](https://qiskit.org/textbook/) — escreve circuitos quânticos de verdade no browser
- [Vitalik — Quantum Computers and Bitcoin (2024)](https://vitalik.eth.limo/general/2024/03/29/qc.html) — implicações para blockchain

---

## Exercícios

A instrutora não atribuiu homework formal por ser aula surpresa. Sugestões:

1. **(Conceitual — fácil)** Por que números complexos e não apenas reais para representar amplitudes de qubit? Dê um exemplo de dois estados com **mesma** probabilidade de medição mas comportamento diferente após interferência.

2. **(Cálculo — fácil)** Calcule o estado resultante de aplicar Hadamard a `|0⟩` e a `|1⟩`. Mostre que `H · H = I` (Hadamard é seu próprio inverso).

3. **(Cálculo — médio)** Verifique que o estado de Bell `|Φ⁺⟩ = (|00⟩ + |11⟩)/√2` **não pode** ser escrito como produto tensor `|a⟩ ⊗ |b⟩` de dois estados de 1 qubit. (Esse é o que define entanglement.)

4. **(Conceitual — médio)** A "harvest now, decrypt later" attack é real para qual tipo de tráfego? Considere: HTTPS efêmero (TLS 1.3 com forward secrecy), backup cifrado de longo prazo, mensagem de Signal de 2018. Qual é o mais vulnerável?

5. **(Prático — médio)** Instale [Qiskit](https://qiskit.org/) e implemente o algoritmo de **Deutsch–Jozsa** para 1 qubit (versão mais simples que Shor, mesma intuição: superposição + interferência). Rode no simulador local.

6. **(Conceitual — difícil)** Por que **Grover** dá apenas √ speedup e **Shor** dá speedup exponencial? Que estrutura matemática Shor explora que Grover não tem disponível?

7. **(Pesquisa — difícil)** Pegue um SNARK em produção (por exemplo o usado pelo zk-rollup que você preferir) e identifique:
   - Que esquema de prova ele usa? (Groth16 / PLONK / Halo2 / STARK)
   - Em que assunção criptográfica se baseia? (DLog / pairing / hash)
   - Em que ponto Shor o quebra? Em que ponto Grover o degrada?

8. **(Conceitual — difícil)** Imagine que em 2032 alguém demonstre Shor real contra RSA-2048. Liste **3 sistemas de produção** que quebram imediatamente e **3 mitigações** já disponíveis hoje que reduziriam o impacto.
