# S4 — Advanced ZK Proof Systems & KZG

| | |
|---|---|
| **Data** | 23 de abril de 2026 |
| **Instrutora** | Milica ([@0xMilica](https://x.com/0xMilica)) |
| **Duração** | 1h47 (com ~30min de espera no início) |
| **Vídeo** | https://www.youtube.com/watch?v=2Ld0jaZpMV4 |
| **Slides** | _enviados pela instrutora — ainda não publicados_ |
| **Leitura** | _papers prometidos pela instrutora — pendentes_ |
| **Transcrição crua** | [`transcript-raw.md`](./transcript-raw.md) |

> Apesar do título "Advanced Systems", o conteúdo prático da aula foi inteiramente dedicado a **KZG** (Kate-Zaverucha-Goldberg), feito à mão num quadro digital com um exemplo numérico pequeno (módulo 7). Esta sessão funciona, na prática, como a aula `03b — Additional Session — KZG` que estava marcada como TBD.

---

## Notas estruturadas da aula

### 1. Recap — Commitment Schemes

Na S3 vimos que um **esquema de compromisso** permite que o provedor se "vincule" a um valor sem revelá-lo, com três propriedades:

| Propriedade | Garantia |
|---|---|
| **Binding** | Provedor não pode trocar o valor depois de comprometido |
| **Hiding** | Verificador não consegue ver o valor até a abertura |
| **Succinctness** | Verificação muito mais barata do que reprocessar tudo |

KZG é um **polynomial commitment scheme**: ao invés de comprometer com um número, o provedor se compromete com **um polinômio inteiro** e depois prova **avaliações pontuais** desse polinômio sem revelá-lo.

### 2. Por que polynomial commitments?

Polinômios são a "lingua franca" dos sistemas SNARK modernos (Plonk, Halo2, Marlin). Provar afirmações sobre programas vira provar afirmações sobre polinômios. KZG fornece o tijolo básico: "eu tenho um polinômio `f` e juro que `f(u) = v`" — sem mostrar `f`.

### 3. Setup do exemplo da aula

A aula trabalha com tudo bem pequeno para caber na cabeça:

| Símbolo | Valor | Significado |
|---|---|---|
| `G` | grupo `{0,1,2,3,4,5,6}` | grupo de ordem 7, gerador 1 |
| `p` | 7 | ordem do grupo (e do field) |
| `F_p` | inteiros mod 7 | finite field onde o polinômio "vive" |
| `τ` (tau) | 5 | **secret** sorteado no trusted setup |
| `f(x)` | `x² + 2x − 1` | polinômio do **provedor** (privado) |

> ⚠️ **Distinção importante:** o **grupo G** é onde os commitments moram; o **field F_p** é onde os coeficientes do polinômio operam. São objetos algébricos diferentes ainda que aqui tenham a mesma cardinalidade.

### 4. Trusted Setup → Global Parameters (GP)

O **trusted setup** sorteia `τ` e calcula publicamente:

```
H_0 = τ⁰ · G = 1 · G  =  1
H_1 = τ¹ · G = 5 · G  =  5
H_2 = τ² · G = 25·G mod 7 = 4
```

Quantos `H_i`? **Tantos quanto o grau (height) do polinômio.** Aqui `deg(f) = 2`, então `H_0, H_1, H_2`.

> 🔥 Após o setup, **τ deve ser destruído** ("burn the computer"). É a *toxic waste*. Quem souber `τ` consegue forjar provas. Por isso usa-se **MPC** (visto na S3): se 1 participante for honesto, o sistema é seguro.

### 5. Commitment ao polinômio

O provedor toma os coeficientes `[f_0, f_1, f_2] = [−1, 2, 1]` e combina linearmente com os GP:

```
C = f_0·H_0 + f_1·H_1 + f_2·H_2
  = (−1)·1 + 2·5 + 1·4
  = −1 + 10 + 4
  = 13   →   13 mod 7 = 6
```

`C = 6` é o **commitment** ao polinômio `f`.

> 🧪 **Sanity check** (só didático — verifier nunca faz isso): `f(τ) = f(5) = 25 + 10 − 1 = 34 mod 7 = 6` ✓.
> Funciona porque `Σ f_i · H_i = Σ f_i · τⁱ · G = f(τ) · G` — *é exatamente avaliar `f` no segredo `τ`, mas sem nunca conhecer `τ` em claro.*

### 6. Evaluation — o protocolo prover/verifier

O verifier desafia o prover a provar uma avaliação:

```
Verifier:  "qual é f(u)?"           ← envia u = 4
Prover:    "f(u) = v"               ← computa v = 2 e envia
```

```
v = f(4) = 16 + 8 − 1 = 23 mod 7 = 2
```

Mas só dizer `v = 2` não convence ninguém. O prover precisa também enviar uma **witness** `W` que o verifier consegue checar contra o commitment `C`.

### 7. Quotient polynomial → witness

Define `f'(x) = f(x) − v`. Como `f'(u) = 0`, pelo **Factor Theorem** existe um `q(x)` tal que:

```
f'(x) = q(x) · (x − u)
```

Calculando para `f'(x) = x² + 2x − 3` dividido por `(x − 4)` (em `F_7`):

```
q(x) = x + 6
```

Esse `q(x)` é o **quotient polynomial**. O provedor **não envia `q(x)`** — envia o **commitment a `q`**, chamado **witness** `W`:

```
W = q_0·H_0 + q_1·H_1
  = 6·1 + 1·5
  = 11   →   11 mod 7 = 4
```

`W = 4` é o que vai pro verifier.

### 8. Verification — checagem algébrica

A equação que o verifier valida:

```
(τ − u) · W  =?=  C − v · G
```

Substituindo:

```
LHS = (5 − 4) · 4 = 4
RHS = 6 − 2 · 1   = 4   ✓
```

Convencido. O prover **conhece** um polinômio `f` cujo commitment é `C` e que avalia em `u` para `v`.

> ⚠️ **Mas tem um truque didático aqui.** O verifier real **não conhece `τ`** — `τ` foi destruído. No mundo real essa equação vira um **pairing check** numa curva elíptica:
> ```
> e( [τ−u]·G₂ , W₁ )  =  e( C₁ − v·G₁ , G₂ )
> ```
> O `[τ−u]·G₂` faz parte dos GP estendidos (curva G₂), e o pareamento bilinear `e(·,·)` permite comparar produtos no expoente sem nunca revelar `τ`. A aula fez tudo "no claro" só para mostrar a estrutura algébrica.

---

## Walkthrough numérico (resumo de bolso)

| Passo | Quem | Cálculo | Valor |
|---|---|---|---|
| Setup | MPC | `τ ← random` | `5` |
| GP | MPC | `H_i = τⁱ·G mod 7` | `[1, 5, 4]` |
| Polinômio | Prover (secreto) | `f(x) = x² + 2x − 1` | coefs `[−1, 2, 1]` |
| Commitment | Prover | `C = Σ f_i·H_i mod 7` | `6` |
| Challenge | Verifier | sorteia `u` | `4` |
| Avaliação | Prover | `v = f(u) mod 7` | `2` |
| Quotient | Prover | `q = (f − v)/(x − u)` | `x + 6` |
| Witness | Prover | `W = Σ q_i·H_i mod 7` | `4` |
| Verify | Verifier | `(τ−u)·W ≡ C − v·G` | `4 = 4` ✓ |

---

## Comentários técnicos e correções

1. **A aula não usa pairings — e o KZG real precisa.** O exemplo do quadro funciona porque `τ` aparece no claro. Em KZG de produção, a verificação sucinta sem revelar `τ` só é possível por causa de **pareamentos bilineares** em curvas elípticas (BLS12-381 é a curva padrão no Ethereum). Sem pairings, ou o verifier conhece `τ` (inseguro) ou ele teria que reconstruir `f` (inviável). É a razão de KZG ser construído sobre G₁, G₂ e G_T.

2. **Distinção `field` vs `group` foi mencionada mas merece reforço.** O grupo `G` é tipicamente um grupo de pontos de uma curva elíptica (ordem `r`, primo). O field `F_r` (escalares) é onde os coeficientes do polinômio vivem. A coincidência de cardinalidade no exemplo (ambos com 7) é didática — em produção, o grupo é `G₁` da BLS12-381 e o field é `F_r` com `r ≈ 2²⁵⁵`.

3. **"Height of polynomial" é grau.** Termo `deg(f)`. Importante porque o tamanho do trusted setup (quantos `H_i`) é `deg(f) + 1`. Se você precisa comprometer com polinômios de até grau `d`, o **structured reference string (SRS)** tem `d+1` elementos.

4. **Por que `(x − u)` divide `f(x) − v`?** Não é arbitrário — é o **Factor Theorem** elementar de álgebra: se `g(u) = 0` então `(x − u) | g(x)`. Como `f(u) = v`, temos `(f − v)(u) = 0`, logo `(x − u) | (f − v)`. **Esse é o coração matemático do esquema** — toda a magia do KZG depende disso.

5. **A divisão polinomial é em `F_p`.** A divisão `(x² + 2x − 3) / (x − 4)` no exemplo dá `x + 6` *em `F_7`*. Em `Z` daria `x + 6` com resto, mas mod 7 fecha exatamente. Vale fazer a conta à mão pra ver.

6. **Conexão com Ethereum (omitida na aula, mas essencial).** O **EIP-4844 (proto-danksharding)** usa **KZG commitments** para os "blobs" dos rollups. A **KZG Trusted Setup Ceremony** do Ethereum (2023, ~140k participantes) gerou os GP em produção. Cada participante adicionou aleatoriedade ao `τ` via MPC — se *qualquer um* destruiu sua share, o `τ` final é seguro.

7. **KZG vs alternativas.** KZG é compacto (commitment = 1 ponto, witness = 1 ponto) mas exige trusted setup. Alternativas:

   | Esquema | Tamanho | Trusted setup? | Quantum-safe? |
   |---|---|---|---|
   | **KZG** | O(1) | sim | não |
   | **FRI** (STARKs) | O(log² n) | não | sim |
   | **IPA** (Bulletproofs) | O(log n) | não | não |

8. **Erro pequeno no quadro.** Em alguns momentos a instrutora escreveu `16` onde queria dizer `10` (no cálculo de `2·H_1 = 2·5`) e corrigiu na hora. O resultado final está certo.

**Leituras complementares:**

- [Kate, Zaverucha, Goldberg — Constant-Size Commitments to Polynomials and Their Applications (2010)](https://www.iacr.org/archive/asiacrypt2010/6477178/6477178.pdf) — paper original
- [Dankrad Feist — KZG Polynomial Commitments](https://dankradfeist.de/ethereum/2020/06/16/kzg-polynomial-commitments.html) — melhor introdução prática
- [Vitalik Buterin — Exploring Elliptic Curve Pairings](https://vitalik.eth.limo/general/2017/01/14/exploring_ecp.html) — fundamento dos pairings
- [Ethereum KZG Ceremony — summary.ethereum.org](https://ceremony.ethereum.org/) — o trusted setup do EIP-4844
- [arnaucube — KZG commitment scheme notes](https://arnaucube.com/blog/kzg-commitments.html) — passo a passo com pairings
- [ZK Whiteboard Sessions — Polynomial Commitments (Dan Boneh)](https://zkhack.dev/whiteboard/) — vídeo

---

## Exercícios

1. **(Conceitual — fácil)** Explique a diferença entre **commitment** e **witness** no KZG. Quem produz cada um? Em que momento do protocolo cada um é enviado?
   > *Output esperado:* texto explicando que o commitment fixa o polinômio e a witness prova uma avaliação específica.

2. **(Prático — fácil)** Refaça o exemplo da aula usando `f(x) = 2x² − x + 3` e `u = 2`, mantendo `p = 7` e `τ = 5`. Calcule `C`, `v`, `q(x)`, `W` e verifique a equação final.
   > *Output esperado:* tabela com todos os valores intermediários e a checagem `(τ−u)·W = C − v·G`.

3. **(Conceitual — médio)** Por que o **trusted setup precisa ser destruído**? O que acontece concretamente se o atacante conseguir `τ`? Mostre como ele forjaria uma "prova" falsa.
   > *Output esperado:* dissertação curta explicando que com `τ` em mãos o atacante calcula `Comm(f') = f'(τ)·G` para qualquer `f'` que escolher, com o mesmo commitment.

4. **(Conceitual — médio)** Demonstre o **Factor Theorem**: se `g(u) = 0`, então `(x − u)` divide `g(x)`. Por que isso é central no KZG?
   > *Output esperado:* prova curta usando o algoritmo de divisão polinomial e explicação do papel no protocolo.

5. **(Prático — médio)** Implemente em Python (sem libs criptográficas) as 4 funções:
   ```python
   def setup(tau, degree, p): -> [H_0, ..., H_d]
   def commit(f_coeffs, GP, p): -> C
   def open(f_coeffs, u, GP, p): -> (v, W)
   def verify(C, u, v, W, tau, p): -> bool
   ```
   Use `p = 7` e o exemplo da aula como teste.
   > *Output esperado:* código rodando que reproduz `C=6, v=2, W=4` e `verify == True`.

6. **(Conceitual — difícil)** A verificação real do KZG é `e([τ−u]·G₂, W₁) = e(C₁ − v·G₁, G₂)`. Explique:
   - Por que precisamos de **dois grupos** `G₁` e `G₂`?
   - O que o pareamento bilinear `e(·,·)` permite que a multiplicação escalar não permite?
   - Por que `τ` nunca é exposto nessa equação?
   > *Output esperado:* explicação técnica de pareamento bilinear (`e(aP, bQ) = e(P,Q)^{ab}`) e como isso "abre" o produto no expoente.

7. **(Prático — difícil)** Pesquise o **EIP-4844** e responda:
   - Por que os rollups usam KZG e não Merkle proofs para os blobs?
   - Qual é o tamanho fixo de um KZG commitment em bytes?
   - Quantos commitments são produzidos por blob?
   > *Output esperado:* resposta técnica citando os números do EIP.

8. **(Conceitual — difícil)** Compare KZG com **FRI** (usado em STARKs). Em que cenários você escolheria cada um? Considere: tamanho da prova, custo do verifier, necessidade de trusted setup, resistência quântica.
   > *Output esperado:* tabela comparativa + recomendação de uso para 2 cenários (rollup de alto volume vs blockchain pós-quântica).
