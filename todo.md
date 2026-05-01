# DriRun - TODO

## Setup & Infraestrutura
- [x] Instalar dependências: expo-location, react-native-maps, @react-native-async-storage/async-storage
- [x] Configurar tema de cores (laranja/azul escuro da Fênix)
- [x] Configurar AsyncStorage para persistência local
- [x] Criar contexto global (AppContext) com estado do usuário, corridas, meta e pet
- [x] Gerar logo da Fênix para o app
- [x] Shim de react-native-maps para web (metro.config.js)

## Onboarding
- [x] Tela de onboarding com campos: Nome, Idade, Peso, Altura, Sexo
- [x] Validação dos campos
- [x] Salvar perfil no AsyncStorage

## Meta Setup
- [x] Tela de seleção de dias (1–365, default 30)
- [x] Validação máximo 365 dias com alerta
- [x] Salvar meta no AsyncStorage

## Navegação
- [x] Navegação por abas (Home, Métricas, Calendário, Pet, Config)
- [x] Navegação principal com expo-router
- [x] Tela de configurações (editar perfil e meta)
- [x] Badge de alerta na aba do Pet quando em perigo

## Home Screen
- [x] Header com nome do usuário e streak
- [x] Card de status do dia (feito/não feito)
- [x] Frase motivacional aleatória
- [x] Botão "Iniciar Corrida"
- [x] Histórico do dia (tempo, pace, distância, kcal)
- [x] Mensagem de parabéns quando dia já foi feito
- [x] Banner de anúncio na parte inferior (placeholder)

## Tracking (Corrida Ativa)
- [x] Solicitar permissão de localização
- [x] MapView com polyline da rota em tempo real
- [x] HUD com distância, pace, tempo, kcal
- [x] Marcadores de início e posição atual
- [x] Botão de finalizar corrida
- [x] useKeepAwake para manter tela ativa
- [x] Cálculo de pace (min/km) em tempo real
- [x] Cálculo de kcal estimadas
- [x] Fallback para web (sem GPS)

## Run Summary / Celebração
- [x] Tela de resumo pós-corrida com animação da Fênix
- [x] Mapa com rota completa
- [x] Cards de métricas finais (distância, pace, tempo, kcal)
- [x] Progresso da meta com barra (X/Y dias)
- [x] Badge de gemas ganhas (+25💎)
- [x] Botão de assistir anúncio para +50💎
- [x] Confetti animado
- [x] Versão web sem mapa

## Métricas
- [x] Filtro diário/semanal/mensal
- [x] Gráfico de distância percorrida (SVG)
- [x] Gráfico de kcal gastas
- [x] Gráfico de evolução do pace
- [x] Gráfico de tempo de corrida

## Calendário + IMC Integrados
- [x] IMC como primeira informação na aba Calendário
- [x] Gauge visual de IMC com barra de categorias
- [x] Grade de quadradinhos numerados
- [x] Emojis nos quadradinhos: 😊 feito, 😢 perdido, ⭐ hoje
- [x] Indicador de progresso percentual

## Meu Pet (Fênix)
- [x] Componente da Fênix com 9 estados visuais
- [x] Lógica de estados baseada em streak e dias sem correr
- [x] Nome editável do pet
- [x] Barra de progresso de evolução
- [x] Lógica de morte (7 dias sem correr) e renascimento das cinzas
- [x] Tela de RIP com motivo
- [x] Botões de Loja e Galeria na aba Pet

## Pet Shop & Gemas
- [x] Ganhar 25 gemas ao concluir atividade do dia
- [x] Ganhar 50 gemas assistindo anúncio (na tela de celebração)
- [x] Pet Shop com 20+ itens categorizados (roupas, acessórios, fundos, mobília, cores)
- [x] Raridades: Comum, Raro, Épico, Lendário
- [x] Galeria de itens possuídos com equipar/desequipar
- [x] Pacotes de gemas (IAP placeholder): 50/150/250/500 gemas

## Configurações
- [x] Seletor de idioma (PT/EN/ES) com flags
- [x] Toggle de notificações com seleção de horário
- [x] Link para tela Sobre
- [x] Link para Pet Shop
- [x] Mensagem motivacional após reset

## i18n / Internacionalização
- [x] Instalar react-i18next
- [x] Criar arquivos de tradução PT/EN/ES
- [x] Detectar idioma do dispositivo automaticamente
- [x] Permitir troca de idioma nas Configurações

## Tela Sobre
- [x] Tela Sobre com vídeo motivacional
- [x] Links LinkedIn/YouTube/GitHub
- [x] Explicação de projeto open source
- [x] Acessível via Configurações

## Monetização
- [x] Banner de anúncio (placeholder para AdMob)
- [x] Opção de remover anúncios (IAP placeholder)
- [x] Sistema de gemas para melhorar pet (IAP placeholder)
- [x] 4 pacotes de gemas disponíveis

## Branding
- [x] Gerar ícone da Fênix para o app
- [x] Atualizar app.config.ts com nome e logo
- [x] Configurar splash screen
- [x] Permissões de localização iOS e Android

## Testes
- [x] 24 testes unitários passando
- [x] Testes de cálculos de corrida (Haversine, calorias, pace)
- [x] Testes de IMC
- [x] Testes de estado do pet
- [x] Testes de validação de meta de dias
- [x] Testes de sistema de gemas
