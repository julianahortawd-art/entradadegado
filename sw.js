// Service Worker do Painel de Acompanhamento de Contratos — Grupo Agroparanã
//
// O QUE ISSO FAZ: sem este arquivo, se o celular/computador estiver sem
// internet no momento de abrir o link do painel, a página nem chega a
// carregar (o navegador não tem nada guardado). Com este arquivo publicado
// ao lado do index.html, o navegador guarda uma cópia da página, e da
// próxima vez que for aberta sem internet, ele mostra essa cópia guardada
// em vez de dar erro — enquanto isso, os DADOS (números do painel) são
// tratados à parte, via localStorage, direto no index.html.
//
// COMO PUBLICAR:
// Salve este arquivo como "sw.js" na MESMA pasta do index.html, no mesmo
// site/domínio onde o painel está hospedado. Não precisa editar nada aqui.
//
// Sempre que você (ou eu) atualizar o index.html com alguma mudança nova,
// troque o número da versão abaixo (CACHE_NAME) — isso força os
// navegadores de todo mundo a buscar a versão nova, em vez de continuar
// preso numa cópia antiga guardada.

const CACHE_NAME = "painel-contratos-v1";
const ARQUIVOS_APP_SHELL = [
  "./",
  "./index.html",
];

// Ao instalar, guarda uma cópia da página principal.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_APP_SHELL))
  );
  self.skipWaiting();
});

// Ao ativar, apaga cópias de versões antigas do cache.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((chave) => chave !== CACHE_NAME)
          .map((chave) => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: tenta buscar da internet primeiro; se conseguir, atualiza o
// cache guardado. Se falhar (sem internet), usa a cópia guardada.
// IMPORTANTE: nunca intercepta chamadas à API do Google Apps Script — essas
// são tratadas separadamente pelo próprio index.html (via localStorage),
// porque são DADOS que mudam o tempo todo, não a "casca" fixa do site.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (request.url.includes("script.google.com")) return;

  event.respondWith(
    fetch(request)
      .then((respostaRede) => {
        if (respostaRede && respostaRede.status === 200) {
          const copia = respostaRede.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
        }
        return respostaRede;
      })
      .catch(() => caches.match(request).then((respostaCache) => respostaCache || caches.match("./index.html")))
  );
});
