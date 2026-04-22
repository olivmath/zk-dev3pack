# S3 — ZKP Basics

| | |
|---|---|
| **Data** | 21 de abril de 2026 |
| **Instrutora** | Milica ([@0xMilica](https://x.com/0xMilica)) |
| **Duração** | 1h19 |
| **Vídeo** | https://www.youtube.com/watch?v=5QigN0mnJws |
| **Slides** | [`slides-prover-verifier-witness-mpc-kzg.pptx`](./slides-prover-verifier-witness-mpc-kzg.pptx) |
| **Leitura** | [`reading-week2-zkp.pdf`](./reading-week2-zkp.pdf) |
| **Transcrição crua** | [`transcript-raw.md`](./transcript-raw.md) |

---

## Notas estruturadas da aula

### 1. Introdução às Provas de Conhecimento Zero (ZKP)

ZKPs surgiram na literatura acadêmica nos anos 1980 como solução para um problema paradoxal: **provar a veracidade de uma afirmação sem revelar a informação que a torna verdadeira**.

- **Utilidade prática:** pilares para **privacidade** (ocultar dados sensíveis) e para **escalabilidade** em blockchains (como ZK-rollups), onde uma prova compacta atesta que milhares de transações são válidas sem que o verificador precise reprocessar cada uma.
- **Conceito fundamental:** a "mágica" consiste em provar a posse de um segredo sem que o segredo saia da posse do provador.

### 2. O Modelo Provedor-Verificador: o Exemplo do Cofre

Para ilustrar provas interativas, a aula usa a analogia de um cofre trancado.

- **Cenário:** o Provedor `P` afirma possuir a chave/combinação. O Verificador `V` não acredita, mas `P` não quer mostrar a chave.
- **Protocolo interativo:** `V` escreve uma mensagem secreta em um papel e a insere por uma fresta no cofre. Se `P` realmente tiver a chave, ele abre, lê e repete a mensagem para `V`.
- **Probabilidade e sorte:** `V` pode suspeitar que `P` apenas adivinhou. Repetindo o teste várias vezes, a probabilidade de sorte cai exponencialmente até se tornar desprezível.

### 3. Blocos de Construção da ZKP

| Conceito | Significado |
|---|---|
| **Provedor (Prover)** | Quem detém o segredo e quer provar algo |
| **Verificador (Verifier)** | Quem valida a prova |
| **Testemunha (Witness)** | O segredo / dado privado (ex: a combinação do cofre) |
| **Afirmação (Statement)** | O que está sendo provado publicamente |
| **Relação** | O vínculo matemático que valida se a Witness satisfaz a Statement |

### 4. Exemplo Prático: pré-imagem de hash (toy example)

Roleplay para simular uma ZKP de pré-imagem de hash usando aritmética modular.

- **Problema:** provar que conhece um número `x` tal que `x mod 7 = 4` sem revelar `x`.
- **Mecânica:**
  - O Provedor tem o segredo `x = 25` (pois `25 mod 7 = 4`).
  - Para não revelar 25, o Provedor adiciona ou subtrai múltiplos do módulo (7).
  - O Provedor envia valores como `32` (`25+7`) ou `39` (`25+14`) para o Verificador.
  - O Verificador calcula o resto desses valores por 7. Como continua sendo 4, o Verificador se convence de que o Provedor conhece a "raiz" da relação, mas nunca aprende `25`.

### 5. Computação Multipartidária (MPC)

MPC permite que várias partes computem uma função sobre seus inputs privados, de modo que apenas o resultado final seja revelado.

#### 5.1 Experimento da média de idades

Simulação para calcular a idade média da turma sem ninguém revelar a idade real:

1. **Offset aleatório:** o primeiro participante escolhe um número aleatório grande (offset) e o adiciona à sua idade.
2. **Encadeamento:** passa o resultado para o próximo, que adiciona sua própria idade. Ninguém sabe a idade de ninguém — o número está mascarado pelo offset.
3. **Finalização:** o último devolve o total acumulado ao primeiro. O primeiro subtrai o offset original e divide pelo número de participantes.

> Resultado: o grupo descobre a média (ex: 31,28 anos), mas as idades individuais permanecem privadas.

#### 5.2 Aplicação: Trusted Setup

MPC é fundamental para o **Trusted Setup** em esquemas como o do Zcash. Várias partes geram parâmetros para o sistema. Se ao menos uma parte for honesta e destruir sua *toxic waste* (os dados usados na geração), o sistema é seguro. Caso famoso: máquinas foram fisicamente destruídas e queimadas para garantir que ninguém pudesse forjar provas.

### 6. As Três Propriedades Fundamentais das ZKPs

| Propriedade | Garantia |
|---|---|
| **Completeness (Compleitude)** | Se a afirmação é verdadeira e o provedor é honesto, o verificador será convencido |
| **Soundness (Robustez)** | Se a afirmação é falsa, um provedor trapaceiro não consegue convencer o verificador (exceto por probabilidade ínfima) |
| **Zero-knowledgeness (Conhecimento zero)** | O verificador não aprende nada além de que a afirmação é verdadeira |

### 7. Esquemas de Compromisso (Commitment Schemes) e KZG

Permitem que alguém se "vincule" a um valor sem revelá-lo imediatamente.

| Propriedade | Significado |
|---|---|
| **Binding** | Uma vez feito o compromisso, o provedor não pode mudá-lo |
| **Hiding** | O verificador não consegue ver o que está dentro do compromisso até abertura |
| **Succinctness** | O trabalho do verificador deve ser mínimo; o peso computacional fica com o provedor |

**KZG (Kate-Zaverucha-Goldberg):** esquema de compromisso polinomial que será aprofundado na próxima aula, essencial para SNARKs modernos.

---

## Comentários técnicos e correções

1. **Simplificação do "toy hash".** A professora usa `x mod 7` como "hash". Tecnicamente, funções hash criptográficas (SHA-256) **não são lineares** — você não pode simplesmente adicionar um múltiplo do módulo para esconder a pré-imagem (o hash mudaria completamente — Efeito Avalanche). O exemplo serve apenas para demonstrar a **interação** e o conceito de ocultação via aritmética modular, aproximando-se mais de um **protocolo de identificação de Schnorr simplificado**.

2. **MPC e o primeiro participante.** No experimento da média, o primeiro participante (que detém o offset) tem poder privilegiado: se for mal-intencionado, pode descobrir a soma das idades dos outros. Protocolos de MPC industriais usam **Shamir's Secret Sharing** ou **Garbled Circuits** para evitar que qualquer participante único tenha essa visão.

3. **KZG e pareamentos.** A aula menciona que o KZG pode ser entendido sem pairings inicialmente. Contudo, para a **verificação sucinta** de compromissos polinomiais na prática, os pareamentos em curvas elípticas são matematicamente indispensáveis (permitem "multiplicação no expoente").

4. **Tipos de ZKP.** A analogia do cofre descreve uma "Prova de Conhecimento" (*proof of knowledge*). É importante diferenciar: ZKP pode provar que uma *afirmação* é verdadeira (ex: "este grafo é 3-colorível") OU que o provedor *conhece* um segredo. O cofre foca no segundo tipo.

**Leituras complementares:**
- [Goldwasser, Micali, Rackoff — The Knowledge Complexity of Interactive Proof Systems (1985)](https://people.csail.mit.edu/silvio/Selected%20Scientific%20Papers/Zero%20Knowledge/The_Knowledge_Complexity_Of_Interactive_Proof_Systems.pdf) — paper original que definiu as 3 propriedades
- [Lindell — A Pragmatic Introduction to Secure Multi-Party Computation](https://ia.cr/2020/300)
- [Dankrad Feist — KZG Polynomial Commitments](https://dankradfeist.de/ethereum/2020/06/16/kzg-polynomial-commitments.html)
- [ZK Hack — recursos para iniciantes](https://zkhack.dev/)
- [Awesome Zero-Knowledge Proofs](https://github.com/matter-labs/awesome-zero-knowledge-proofs)

---

## Exercícios

1. **(Conceitual — fácil)** Explique a diferença entre **Completeness** e **Soundness**. O que acontece se um sistema de prova não for sound?
   > *Output esperado:* texto explicando que soundness protege contra provadores mentirosos.

2. **(Prático — fácil)** No exemplo MPC com 3 pessoas (A, B, C):
   - A escolhe offset = 100 e tem 20 anos
   - B tem 30 anos
   - C tem 40 anos
   Simule o passo a passo dos valores enviados e o cálculo final.
   > *Output esperado:* tabela com valores parciais (120, 150, 190) e resultado final (média = 30).

3. **(Conceitual — médio)** Por que a propriedade **Hiding** é necessária em um esquema de compromisso? Dê um exemplo onde a falta dela invalidaria a privacidade do protocolo.
   > *Output esperado:* dissertação curta sobre por que o verificador não pode antecipar o segredo.

4. **(Prático — médio)** Implemente em Python uma função que simule o "Toy Hash" da aula:
   1. Recebe um segredo `x` e um módulo `m`
   2. Gera uma lista de 5 valores que "provam" o conhecimento de `x` sem revelá-lo (somando múltiplos aleatórios de `m`)
   > *Output esperado:* código Python e valores gerados.

5. **(Conceitual — difícil)** Explique o papel do **Trusted Setup** em esquemas como o KZG. O que é a "toxic waste" e por que a computação multipartidária é usada para gerá-la?
   > *Output esperado:* explicação técnica sobre geração de parâmetros e risco de conluio.

6. **(Prático — médio)** Se um protocolo de prova tem probabilidade de erro `1/2` por rodada, quantas rodadas são necessárias para que a confiança do verificador seja superior a 99,9%?
   > *Output esperado:* cálculo de probabilidade (`2^10 = 1024` → 10 rodadas).

7. **(Conceitual — médio)** Compare Provas Interativas e Provas Não-Interativas (NIZK). Vantagens e desvantagens de cada uma em comunicação e armazenamento em blockchain?
   > *Output esperado:* quadro comparativo mencionando mensagens únicas vs idas e vindas.

8. **(Prático — difícil)** Em um sistema MPC de soma com offset, se todos os participantes decidirem coludir contra o participante 2, eles conseguem descobrir a idade dele? Justifique com base no fluxo de informação visto na aula.
   > *Output esperado:* análise lógica mostrando que se os vizinhos (anterior e posterior) compartilharem seus valores, eles isolam a contribuição do meio.
