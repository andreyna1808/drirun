# DriRun – Design Document

## Brand Identity

**App Name:** DriRun  
**Tagline:** Corra. Evolua. Renasça.  
**Primary Color:** #FF6B35 (laranja fogo — energia, movimento, Fênix)  
**Secondary Color:** #1A1A2E (azul escuro noturno — profundidade, foco)  
**Accent:** #FFD700 (dourado — conquista, evolução do pet)  
**Background Light:** #F8F9FA  
**Background Dark:** #0F0F1A  
**Success:** #22C55E  
**Error:** #EF4444  

---

## Screen List

1. **Onboarding** – Coleta de dados do usuário (nome, idade, peso, altura, sexo)
2. **Meta Setup** – Seleção de quantos dias de objetivo (1–365, default 30)
3. **Home** – Tela principal com status do dia, botão de iniciar corrida, frases motivacionais e histórico do dia
4. **Tracking (Active Run)** – Mapa com rota em tempo real, distância, pace, tempo e botão de finalizar
5. **Run Summary** – Resumo pós-corrida com mapa, distância, pace, tempo, kcal
6. **Metrics** – Gráficos de desempenho (distância, kcal, pace, tempo) com filtros diário/semanal/mensal
7. **Calendar** – Grade de dias com status (verde = feito, vermelho = não feito)
8. **My Pet (Fênix)** – Pet virtual com estados (feliz, triste, deprimido, morto, renascendo, livre)
9. **BMI (IMC)** – Calculadora de IMC com resultado e classificação
10. **Drawer Menu** – Menu lateral com navegação para Métricas, Calendário, Meu Pet, IMC

---

## Primary Content and Functionality

### Onboarding
- Formulário sequencial (passo a passo) com campos: Nome, Idade, Peso (kg), Altura (cm), Sexo
- Validação de campos antes de avançar
- Armazenado localmente via AsyncStorage

### Meta Setup
- Input numérico para número de dias
- Máximo: 365 dias (com alerta ao tentar exceder)
- Default: 30 dias
- Botão de confirmar meta

### Home
- Header com nome do usuário e streak atual
- Card de status do dia: "Você já correu hoje?" → Sim (parabéns) / Não (botão Iniciar)
- Frase motivacional aleatória rotativa
- Histórico do dia: tempo, pace/km, distância, kcal
- Banner de anúncio na parte inferior (não invasivo)

### Tracking (Active Run)
- MapView em tela cheia com polyline da rota percorrida
- Marcador de início (verde) e posição atual (laranja)
- HUD sobreposto: distância (km), pace atual (min/km), tempo decorrido, kcal estimadas
- Botão de FINALIZAR (vermelho, grande, centralizado na parte inferior)
- Tela permanece ativa (useKeepAwake)

### Run Summary
- Mapa com rota completa
- Cards de métricas: Distância, Pace Médio, Tempo Total, Kcal
- Botão "Salvar e Concluir" → marca o dia como feito

### Metrics
- Filtro de período: Diário | Semanal | Mensal
- Gráfico de barras: Distância por período
- Gráfico de linha: Evolução do Pace
- Gráfico de barras: Kcal gastas
- Gráfico de linha: Tempo de corrida
- Usando react-native-chart-kit ou victory-native

### Calendar
- Grade de quadradinhos numerados (1 ao N dias da meta)
- Verde = dia concluído, Vermelho = dia não concluído, Cinza = dia futuro
- Indicador de progresso percentual no topo

### My Pet (Fênix)
- Ilustração animada da Fênix em diferentes estados:
  - **Ovo** (dias 1–3 sem corrida acumulada)
  - **Filhote** (dias 1–7 concluídos)
  - **Jovem** (dias 8–20 concluídos)
  - **Adulto** (dias 21–meta concluídos)
  - **Livre** (meta completa — voa livre!)
  - **Triste** (1–2 dias sem correr)
  - **Deprimido** (3–6 dias sem correr)
  - **Morto** (7+ dias sem correr — RIP)
  - **Renascendo** (após morte, ao retomar corrida)
- Nome editável do pet
- Barra de progresso de evolução
- Contador de dias vivos / dias de streak

### BMI (IMC)
- Exibe peso e altura do perfil
- Cálculo automático: IMC = peso / (altura/100)²
- Classificação: Abaixo do peso / Normal / Sobrepeso / Obesidade
- Sugestão de meta de saúde baseada no IMC

### Drawer Menu
- Avatar/inicial do usuário
- Links: Métricas, Calendário, Meu Pet, IMC
- Configurações (editar perfil, editar meta)
- Remover anúncios (IAP)

---

## Key User Flows

### Flow 1: Primeiro Acesso
1. App abre → Tela de Onboarding
2. Usuário preenche dados → Avança para Meta Setup
3. Usuário define dias → Confirma → Tela Home

### Flow 2: Iniciar Corrida
1. Home → Botão "Iniciar Corrida"
2. Tela de Tracking ativa → GPS ligado, mapa carrega
3. Usuário corre → Rota desenhada em tempo real
4. Usuário aperta "Finalizar"
5. Tela de Resumo → Botão "Salvar"
6. Volta para Home → Dia marcado como concluído

### Flow 3: Verificar Pet
1. Drawer → "Meu Pet"
2. Vê estado atual da Fênix
3. Pode renomear o pet
4. Vê progresso de evolução

### Flow 4: Ver Métricas
1. Drawer → "Métricas"
2. Seleciona filtro (diário/semanal/mensal)
3. Visualiza gráficos de desempenho

---

## Color Choices

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| primary | #FF6B35 | #FF8C5A | Botões principais, CTAs, destaques |
| background | #F8F9FA | #0F0F1A | Fundo das telas |
| surface | #FFFFFF | #1A1A2E | Cards, modais |
| foreground | #1A1A2E | #F8F9FA | Texto principal |
| muted | #6B7280 | #9CA3AF | Texto secundário |
| border | #E5E7EB | #2D2D4E | Bordas e divisores |
| success | #22C55E | #4ADE80 | Dias concluídos, pet feliz |
| error | #EF4444 | #F87171 | Dias perdidos, pet morto |
| accent | #FFD700 | #FFD700 | Conquistas, pet adulto/livre |

---

## Typography

- **Headings:** Font weight 700, sizes 28/24/20
- **Body:** Font weight 400/500, sizes 16/14
- **Caption:** Font weight 400, size 12, muted color
- **Numbers/Stats:** Font weight 700, sizes 32/24 (para métricas de corrida)

---

## Component Patterns

- **RunCard:** Card com métricas de corrida (distância, pace, tempo, kcal)
- **DaySquare:** Quadradinho do calendário com número e cor de status
- **PetDisplay:** Componente da Fênix com animação e barra de progresso
- **MetricChart:** Wrapper de gráfico com título e filtro de período
- **MotivationalQuote:** Card rotativo com frases motivacionais
- **AdBanner:** Banner de anúncio fixo na parte inferior (não invasivo, 50px altura)
