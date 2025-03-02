import { renderHomePage } from './home.js';
import { renderControlPage } from './control.js';
import { renderContactPage } from './contact.js';
import { renderLoginPage } from './login.js';
import { isAuthenticated } from './auth.js';

export function initRouter(contentDiv, updateDynamicElements, getAuthStatus) {
    const routes = {
        '/': () => renderHomePage(contentDiv),
        '/controle': () => {
            return renderControlPage(contentDiv);
        },
        '/contato': () => renderContactPage(contentDiv),
        '/login': (message) => {
            if (getAuthStatus()) {
                history.pushState({ page: 'control' }, null, '/controle');
                return renderControlPage(contentDiv);
            }
            const loginMessage = message === 'controle' 
                ? "Para ter acesso ao controle das impressoras, primeiro você precisa se logar."
                : null;
            return renderLoginPage(contentDiv, loginMessage);
        }
    };

    let currentCleanup = null;

    function loadRoute() {
        console.log('Carregando rota:', window.location.pathname);
        
        // Limpar a página atual antes de carregar a nova
        if (currentCleanup) {
            console.log('Executando limpeza da página anterior');
            currentCleanup();
            currentCleanup = null;
        }

        // Limpar o conteúdo do contentDiv para evitar duplicações
        contentDiv.innerHTML = '';

        const path = window.location.pathname || '/';
        const state = history.state || {};
        const message = state.message;
        
        let route;
        if (path === '/login') {
            route = () => routes['/login'](message);
        } else {
            route = routes[path] || routes['/'];
        }
        
        console.log('Renderizando rota:', path);
        const { cleanup, elements } = route();
        currentCleanup = cleanup;
        updateDynamicElements(elements);
    }

    // Remover event listeners antigos para evitar duplicações
    function setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(link => {
            // Remover event listeners antigos
            const oldLink = link.cloneNode(true);
            link.parentNode.replaceChild(oldLink, link);
            
            // Adicionar novo event listener
            oldLink.addEventListener('click', (e) => {
                e.preventDefault();
                const page = oldLink.getAttribute('data-page');
                const path = page === 'control' ? '/controle' : page === 'contact' ? '/contato' : '/';
                history.pushState({ page }, null, path);
                loadRoute();
            });
        });

        const authButton = document.getElementById('auth-button');
        if (authButton) {
            // Remover event listeners antigos
            const oldButton = authButton.cloneNode(true);
            authButton.parentNode.replaceChild(oldButton, authButton);
            
            // Adicionar novo event listener
            oldButton.addEventListener('click', () => {
                if (!getAuthStatus()) {
                    history.pushState({ page: 'login' }, null, '/login');
                    loadRoute();
                }
            });
        }
    }

    // Configurar event listeners
    setupEventListeners();

    // Escutar eventos de mudança de autenticação
    window.addEventListener('auth-state-changed', (event) => {
        console.log('Evento auth-state-changed recebido');
        loadRoute();
    });

    // Escutar eventos de mudança de rota personalizada
    window.addEventListener('route-change', () => {
        console.log('Evento route-change recebido');
        loadRoute();
    });

    // Escutar eventos de navegação do histórico
    window.addEventListener('popstate', () => {
        console.log('Evento popstate recebido');
        loadRoute();
    });

    // Carregar a rota inicial
    loadRoute();
}