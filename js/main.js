const container = document.getElementById('powersContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.main-btn'); // Botões principais
const subFilterBtns = document.querySelectorAll('[data-subfilter]'); // Botões Habilidade/Poder
const pathBtns = document.querySelectorAll('[data-path]'); // Botões de Caminho (Bruxo/Mago/etc)
const classFiltersDiv = document.getElementById('classFilters');
const classSelector = document.getElementById('classSelector');
const togglePathsBtn = document.getElementById('togglePathsBtn');
const pathsWrap = document.getElementById('pathsWrap');

// MODAL
const modal = document.getElementById('powerModal');
const modalTitle = document.getElementById('modalTitle');
const modalType = document.getElementById('modalType');
const modalReq = document.getElementById('modalReq');
const modalDesc = document.getElementById('modalDesc');
const closeBtn = document.querySelector('.close-btn');

// --- CONFIGURAÇÃO: Quais botões aparecem para qual classe ---
const classPaths = {
    'arcanista': ['arcanista-base', 'bruxo', 'feiticeiro', 'mago', 'necromante'],
    'inventor': ['inventor-base', 'alquimista'],
    'ladino': ['ladino-base', 'ventanista'],
    'lutador': ['lutador-base', 'atleta'],
    'nobre': ['nobre-base', 'burgues'],
    'bucaneiro': ['bucaneiro-base', 'duelista'],
    'druida': ['druida-base', 'ermitao'],
    'guerreiro': ['guerreiro-base', 'inovador'],
    'barbaro': ['barbaro-base', 'machadodepedra'],
    'bardo': ['bardo-base', 'magimarcialista'],
    'paladino': ['paladino-base', 'santo'],
    'cacador': ['cacador-base', 'seteiro'],
    'cavaleiro': ['cavaleiro-base', 'vassalo'],
    'clerigo': ['clerigo-base', 'usurpador'],
    'treinador': [],
    'frade': [] // Adicione esta linha
    // Classes sem variantes (Guerreiro, etc) não precisam estar aqui; o código esconderá os botões.
};

// ===== CLASSIFICAÇÃO DOS DEUSES =====
// Os nomes devem bater EXATAMENTE com o campo `category` do data.js
const DEUSES_MAIORES = new Set([
    'Aharadak', 'Allihanna', 'Arsenal', 'Azgher', 'Hyninn', 'Kallyadranoch',
    'Khalmyr', 'Lena', 'Lin-Wu', 'Marah', 'Megalokk', 'Nimb', 'Oceano',
    'Sszzaas', 'Tanna Toh', 'Tenebra', 'Thwor', 'Thyatis', 'Valkaria', 'Wynna'
]);

const DEUSES_MORTOS = new Set([
    'Ragnar', 'Glórienn', 'Tauron'
]);

const DEUSES_MENORES = new Set([
    'Gwendolynn', 'Mauziell', 'Tibar', 'A Espada Deus', 'Akok', 'Altair',
    'Anilatir', 'Apis', 'Artaphan', 'Ayllana', 'Beluhga', 'Benthos',
    'Betsumial', 'Blinar', 'Caerdellach', 'Canastra', 'Canora', 'Cette',
    'Champarr', 'Dahriol', 'Drumak', 'Dunsark', 'Elrophin', 'Escamandra',
    'Esmeralda', 'Garanaam', 'Garth', 'Goharom', 'Granto', 'Gratissa',
    'Hippion', 'Hurlaagh', 'Hydora', 'Inghlblhpholtsgt', 'Irione', 'Jandra',
    'Klangor', 'Kurur Lianth', 'Laan', 'Lamashtu', 'Lupan', 'Luvithy',
    'Marina', 'Mzzileyn', 'Nerelim', 'Neruíte', 'O Deus Cristal de Urielka',
    'O Deus das Cidades', 'O Deus do Medo', 'Piscigeros', 'Rhond', 'Sartan',
    'Sckhar', 'Sunnary', 'Tamagrah', 'Tessalus', 'Toris', 'Tukala', 'Ur',
    'Yasshara', 'Zadbblein', 'Zakharov', 'Drelene'
]);

// Estado Global
let state = {
    mainFilter: 'all',
    selectedClass: 'arcanista',
    subType: 'all',
    path: null,
    complicationFilter: 'all',
    godType: 'all',      // 'all' | 'maior' | 'menor'
    selectedGod: 'all'   // nome do deus ou 'all'
};

// --- UI: mostrar/ocultar "Caminhos" (filtro secundário) ---
function setPathsOpen(open) {
    if (!classFiltersDiv || !pathsWrap || !togglePathsBtn) return;
    classFiltersDiv.classList.toggle('show-paths', open);
    togglePathsBtn.classList.toggle('is-open', open);
    togglePathsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    pathsWrap.setAttribute('aria-hidden', open ? 'false' : 'true');
}

if (togglePathsBtn) {
    togglePathsBtn.addEventListener('click', () => {
        const isOpen = classFiltersDiv.classList.contains('show-paths');
        setPathsOpen(!isOpen);
    });
}

// --- FUNÇÕES DE VISUALIZAÇÃO ---

// Função que controla quais botões de variante aparecem
function updatePathButtons() {
    // 1. Esconde todos os botões de caminho primeiro
    pathBtns.forEach(btn => {
        btn.style.display = 'none';
        btn.classList.remove('active'); // Remove o active de todos para resetar
    });

    // 2. Verifica se a classe selecionada tem caminhos configurados
    const allowedPaths = classPaths[state.selectedClass];

    if (allowedPaths && allowedPaths.length > 0) {
        // 3. Mostra os botões permitidos e seleciona o padrão
        const defaultPath = `${state.selectedClass}-base`; // Ex: 'arcanista-base'

        pathBtns.forEach(btn => {
            const btnPath = btn.getAttribute('data-path');
            if (allowedPaths.includes(btnPath)) {
                btn.style.display = 'inline-block';
                
                // --- NOVA LÓGICA: Marca como 'Padrão' automaticamente ---
                if (btnPath === defaultPath) {
                    btn.classList.add('active');
                    state.path = btnPath;
                }
            }
        });
    } else {
        // Se a classe não tem variantes, reseta o path do estado
        state.path = null;
    }

    // 4. UI: mostra/oculta o botão "Caminhos" se houver variantes visíveis
    if (togglePathsBtn && pathsWrap) {
        const anyVisible = Array.from(pathBtns).some(b => b.style.display !== 'none');
        togglePathsBtn.style.display = anyVisible ? 'inline-block' : 'none';
        
        // Abre automaticamente se houver caminhos para mostrar
        if (anyVisible) {
            setPathsOpen(true);
        } else {
            setPathsOpen(false);
        }
    }
}
// Renderização dos Cards
function renderPowers(powers) {
    container.innerHTML = '';

    if (powers.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color:#777; margin-top:20px;">Nenhum item encontrado para os filtros atuais.</p>';
        return;
    }

    powers.forEach(power => {
        const card = document.createElement('div');

        let extraClass = '';
        if (power.type === 'tormenta') extraClass = 'type-tormenta';
        if (power.subType === 'ability') extraClass += ' type-ability';

        card.className = `power-card ${extraClass}`;
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <div class="power-header">
                <span class="power-name">${power.name}</span>
                <span class="power-type">${translateType(power)}</span>
            </div>
            <div class="power-meta">
                <strong>Pré-requisito:</strong> ${power.req}
            </div>
            <div class="power-desc">
                ${power.desc} 
            </div>
            <div class="power-hint">Clique para ver detalhes</div>
        `;

        card.addEventListener('click', () => openModal(power));
        container.appendChild(card);
    });
}

function translateType(power) {
    if (power.type === 'class') {
        let text = power.subType === 'ability' ? 'Habilidade' : 'Poder';
        // Mostra o caminho se não for 'all' e não for o padrão
        if (power.pathReq && power.pathReq !== 'all' && power.pathReq !== 'inventor-base') {
            text += ` (${capitalize(power.pathReq)})`;
        }
        return text;
    }
    if (power.type === 'complication') {
        return power.class ? `Complicação (${capitalize(power.class)})` : 'Complicação Geral';
    }
    return power.category || power.type;
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// Lógica de Filtro
function filterPowers() {
    const searchTerm = searchInput.value.toLowerCase();

    const filtered = powersData.filter(power => {
        // 1. Filtro Principal
        if (state.mainFilter !== 'all' && power.type !== state.mainFilter) return false;

        // 2. Logica de Classe
        if (state.mainFilter === 'class') {
            if (power.class !== state.selectedClass) return false;
            if (state.subType !== 'all' && power.subType !== state.subType) return false;

            // Lógica de Caminho (Path)
            if (state.path) {
                // Se um caminho específico está ativo (ex: Alquimista), mostra Geral ('all') + Específico ('alquimista')
                if (power.pathReq !== 'all' && power.pathReq !== state.path) return false;

                // --- NOVO: REGRA DE EXCEÇÃO PARA VASSALO ---
                // Se o filtro for Vassalo, ESCONDE os poderes opcionais gerais ('power' + 'all')
                // Assim, só aparecem as Habilidades de Classe e as Habilidades de Vassalo
                if (state.path === 'vassalo' && power.subType === 'power' && power.pathReq === 'all') {
                    return false;
                }
            } else {
                // Se NENHUM caminho está ativo (visão geral da classe):
                const isVariant = ['bruxo', 'feiticeiro', 'mago', 'necromante',
                    'inventor-base', 'alquimista',
                    'lutador-base', 'atleta',
                    'nobre-base', 'burgues',
                    'bucaneiro-base', 'duelista',
                    'druida-base', 'ermitao',
                    'guerreiro-base', 'inovador',
                    'barbaro-base', 'gigante',
                    'bardo-base', 'magimarcialista',
                    'paladino-base', 'santo',
                    'cacador-base', 'seteiro',
                    'cavaleiro-base', 'vassalo'].includes(power.pathReq);

                if (isVariant) return false;
            }
        }

        if (state.mainFilter === 'complication') {
            // Filtra pela categoria (Geral, Classe, Idade)
            if (state.complicationFilter !== 'all' && power.category !== state.complicationFilter) return false;
        }

        // 4. Filtro de Deus Concedente
        // O campo é `category` e pode ter múltiplos deuses: "Thwor, Valkaria"
        if (state.mainFilter === 'conceded') {
            const cats = (power.category || '').split(',').map(s => s.trim());
            if (state.godType === 'maior' && !cats.some(g => DEUSES_MAIORES.has(g))) return false;
            if (state.godType === 'menor' && !cats.some(g => DEUSES_MENORES.has(g))) return false;
            if (state.godType === 'morto' && !cats.some(g => DEUSES_MORTOS.has(g))) return false;
            if (state.selectedGod !== 'all' && !cats.includes(state.selectedGod)) return false;
        }

        // 3. Busca
        const matchesSearch = power.name.toLowerCase().includes(searchTerm) ||
            power.desc.toLowerCase().includes(searchTerm) ||
            power.req.toLowerCase().includes(searchTerm);

        return matchesSearch;
    });

    renderPowers(filtered);
}

// --- EVENT LISTENERS ---

// Botões Principais (Combate, Classe, etc)
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mainFilter = btn.getAttribute('data-filter');

        if (state.mainFilter === 'class') {
            classFiltersDiv.style.display = 'block';
            updatePathButtons(); // ATUALIZA OS BOTÕES AO ENTRAR NA ABA
        } else {
            classFiltersDiv.style.display = 'none';
        }

        const compFiltersDiv = document.getElementById('complicationFilters');
        const notice = document.getElementById('complicationNotice');
        const concededFiltersDiv = document.getElementById('concededFilters');

        if (state.mainFilter === 'complication') {
            compFiltersDiv.style.display = 'flex';
            if (notice) notice.style.display = 'flex';
        } else {
            compFiltersDiv.style.display = 'none';
            if (notice) notice.style.display = 'none';
        }

        if (state.mainFilter === 'conceded') {
            concededFiltersDiv.style.display = 'flex';
            updateGodSelector(); // popula o select com os deuses corretos
        } else {
            concededFiltersDiv.style.display = 'none';
            // reseta estado dos deuses ao sair da aba
            state.godType = 'all';
            state.selectedGod = 'all';
        }

        filterPowers();
    });
});

const compFilterBtns = document.querySelectorAll('[data-compfilter]');

compFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        compFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.complicationFilter = btn.getAttribute('data-compfilter');
        filterPowers();
    });
});

// Subfiltros (Habilidade/Poder)
subFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        subFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.subType = btn.getAttribute('data-subfilter');
        filterPowers();
    });
});

// Caminhos (Bruxo, Alquimista, etc)
pathBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            state.path = null;
        } else {
            pathBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.path = btn.getAttribute('data-path');
        }
        filterPowers();
    });
});

// ===== FILTRO DE DEUSES =====
const godSelector = document.getElementById('godSelector');

/**
 * Popula o #godSelector com os deuses do tipo selecionado
 * e mostra/esconde o select conforme necessário.
 */
function updateGodSelector() {
    if (!godSelector) return;

    let lista = [];
    if (state.godType === 'maior') {
        lista = [...DEUSES_MAIORES].sort();
    } else if (state.godType === 'menor') {
        lista = [...DEUSES_MENORES].sort();
    } else if (state.godType === 'morto') {
        lista = [...DEUSES_MORTOS].sort();
    } else {
        lista = [...DEUSES_MAIORES, ...DEUSES_MENORES, ...DEUSES_MORTOS].sort();
    }

    godSelector.innerHTML = '<option value="all">-- Todos os Deuses --</option>' +
        lista.map(d => `<option value="${d}">${d}</option>`).join('');

    // garante que o valor selecionado ainda é válido
    if (state.selectedGod !== 'all' && !lista.includes(state.selectedGod)) {
        state.selectedGod = 'all';
    }
    godSelector.value = state.selectedGod;

    // mostra o select apenas quando há um tipo específico selecionado
    godSelector.style.display = lista.length > 0 && state.godType !== 'all' ? 'inline-block' : 'none';
}

// Radios Todos / Maiores / Menores
document.querySelectorAll('input[name="godType"]').forEach(radio => {
    radio.addEventListener('change', () => {
        state.godType = radio.value;
        state.selectedGod = 'all';
        updateGodSelector();
        filterPowers();
    });
});

// Select de deus específico
if (godSelector) {
    godSelector.addEventListener('change', () => {
        state.selectedGod = godSelector.value;
        filterPowers();
    });
}

// Seletor de Classe
classSelector.addEventListener('change', (e) => {
    state.selectedClass = e.target.value;
    state.path = null; // Reseta o caminho ao mudar de classe
    pathBtns.forEach(b => b.classList.remove('active'));

    updatePathButtons(); // ATUALIZA QUAIS BOTÕES APARECEM
    filterPowers();
});

searchInput.addEventListener('input', filterPowers);

// MODAL LOGIC
function openModal(power) {
    modalTitle.innerText = power.name;
    modalType.innerText = translateType(power);
    modalReq.innerText = power.req;
    modalDesc.innerHTML = power.desc;
    modal.style.display = 'flex';

    const existingVariantBox = document.getElementById('variantBox');
    if (existingVariantBox) existingVariantBox.remove();

    if (power.variants && power.variants.length > 0) {
        const variantBox = document.createElement('div');
        variantBox.id = 'variantBox';
        variantBox.style.cssText = 'margin-top:14px; border-top:1px solid var(--border); padding-top:12px;';

        variantBox.innerHTML = `
    <label style="font-weight:700; font-size:.9rem; display:block; margin-bottom:6px;">
      ⚡ Escolha seu deus:
    </label>
    <select id="variantSelect" style="width:100%; padding:9px 12px; border-radius:10px;
      border:2px solid var(--border); background:var(--card-bg); color:var(--text-main);
      font-size:.9rem; cursor:pointer;">
      <option value="">— Selecione —</option>
      ${power.variants.map((v, i) =>
            `<option value="${i}">${v.deity}</option>`
        ).join('')}
    </select>
    <div id="variantDesc" style="margin-top:10px; padding:10px 12px; border-radius:10px;
      background:rgba(0,0,0,.04); border:1px solid var(--border); font-size:.88rem;
      line-height:1.5; color:var(--text-muted); display:none;"></div>
  `;

        // Insira dentro do modal-body, após a descrição principal
        document.getElementById('modalDesc').after(variantBox);

        document.getElementById('variantSelect').addEventListener('change', function () {
            const idx = this.value;
            const descEl = document.getElementById('variantDesc');
            if (idx === '') {
                descEl.style.display = 'none';
            } else {
                descEl.textContent = power.variants[idx].desc;
                descEl.style.display = 'block';
            }
        });
    }

}
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
document.addEventListener('keydown', (e) => { if (e.key === "Escape") modal.style.display = 'none'; });



// Inicialização
updatePathButtons(); // Garante estado inicial correto
renderPowers(powersData);
if (classFiltersDiv) classFiltersDiv.style.display = 'none';  // começa oculto
setPathsOpen(false);

// --- LÓGICA DO BOTÃO VOLTAR AO TOPO ---
document.addEventListener('DOMContentLoaded', () => {
    const backToTopBtn = document.getElementById("backToTopBtn");

    if (backToTopBtn) {
        // Monitora a rolagem
        window.addEventListener("scroll", () => {
            // Verifica a rolagem vertical (eixo Y)
            if (window.scrollY > 300) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        });

        // Ação de clicar
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    } else {
        console.warn("Botão 'backToTopBtn' não encontrado no HTML.");
    }
});

// ============================================================
//  CARRINHO DE PODERES
// ============================================================

let cart = JSON.parse(localStorage.getItem('selectedPowers')) || [];
let _currentPower = null; // poder aberto no modal

const cartFab = document.getElementById('cartFab');
const cartCount = document.getElementById('cartCount');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartList = document.getElementById('cartList');
const cartEmpty = document.getElementById('cartEmpty');
const cartExportBtn = document.getElementById('cartExportBtn');
const cartClearBtn = document.getElementById('cartClearBtn');
const modalAddToCart = document.getElementById('modalAddToCart');

// --- Abrir/fechar painel ---
function openCart() {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('active');
}
function closeCart() {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('active');
}
cartFab.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

// --- Verifica se poder já está no carrinho ---
function inCart(power) {
    return cart.some(p => p.name === power.name && p.type === power.type);
}

// --- Atualiza UI ---
function renderCart() {
    const count = cart.length;

    // FAB badge
    cartCount.textContent = count;
    cartCount.classList.toggle('zero', count === 0);

    // Lista vazia vs. lista
    if (count === 0) {
        cartEmpty.classList.remove('hidden');
        cartList.classList.add('hidden');
    } else {
        cartEmpty.classList.add('hidden');
        cartList.classList.remove('hidden');
        cartList.innerHTML = '';
        cart.forEach((power, idx) => {
            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${power.name}</div>
                    <div class="cart-item-meta">${translateType(power)} · Req: ${power.req}</div>
                </div>
                <button class="cart-item-remove" title="Remover" data-idx="${idx}">✕</button>
            `;
            cartList.appendChild(li);
        });

        // Listeners de remover
        cartList.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-idx'));
                cart.splice(i, 1);
                renderCart();
                updateModalCartBtn();
            });
        });
    }

    // Salva o estado do carrinho sempre (mesmo se estiver vazio)
    localStorage.setItem('selectedPowers', JSON.stringify(cart));

    // Botões de ação
    cartExportBtn.disabled = count === 0;
    cartClearBtn.disabled = count === 0;
}

// --- Botão "Adicionar ao Carrinho" no modal ---
function updateModalCartBtn() {
    if (!_currentPower) return;
    const already = inCart(_currentPower);
    modalAddToCart.textContent = already ? 'Remover do Carrinho' : '＋ Adicionar ao Carrinho';
    modalAddToCart.classList.toggle('in-cart', already);
}

modalAddToCart.addEventListener('click', () => {
    if (!_currentPower) return;
    if (inCart(_currentPower)) {
        cart = cart.filter(p => !(p.name === _currentPower.name && p.type === _currentPower.type));
    } else {
        const variantSelect = document.getElementById('variantSelect');
        const chosenIdx = variantSelect ? variantSelect.value : '';
        const cartItem = { ..._currentPower }; // cópia, não referência
        if (chosenIdx !== '' && _currentPower.variants) {
            const v = _currentPower.variants[chosenIdx];
            cartItem.name = `${_currentPower.name} (${v.deity})`;
            cartItem.desc = v.desc;
        }
        cart.push(cartItem);
    }
    renderCart();
    updateModalCartBtn();
});

// --- Limpar tudo ---
cartClearBtn.addEventListener('click', () => {
    if (!confirm('Remover todos os poderes do carrinho?')) return;
    cart = [];
    renderCart();
    updateModalCartBtn();
});

// --- Enviar para a Ficha (via localStorage, igual ao script_itens.js) ---
cartExportBtn.innerText = "🚀 Enviar para a Ficha";

cartExportBtn.addEventListener('click', () => {
    if (cart.length === 0) return;

    // 1. Carrega os dados atuais da ficha para não apagar nada
    let fichaRaw = localStorage.getItem('t20SheetData');
    let fichaData = fichaRaw ? JSON.parse(fichaRaw) : {};
    if (!fichaData.classAbilities) fichaData.classAbilities = [];

    // 2. Mapeia os poderes do carrinho para o formato { name, desc } da ficha
    const poderesParaEnviar = cart.map(power => ({
        name: power.name,
        desc: (power.req && power.req !== '-' ? `Req: ${power.req}\n` : '') + power.desc
    }));

    // 3. Adiciona à seção de Poderes & Habilidades (sem apagar o que já existe)
    fichaData.classAbilities = fichaData.classAbilities.concat(poderesParaEnviar);

    // 4. Salva no localStorage compartilhado (mesmo domínio: nicholemos.github.io)
    localStorage.setItem('t20SheetData', JSON.stringify(fichaData));

    alert(`${poderesParaEnviar.length} poder(es) enviado(s) para a ficha com sucesso!\n\nA ficha será aberta em uma nova aba.`);

    // 5. Abre a ficha em uma nova aba
    window.open('https://nicholemos.github.io/ficha/', '_blank');
});


// --- Patch no openModal para rastrear poder atual ---
const _origOpenModal = openModal;
window.openModal = function (power) {
    _currentPower = power;
    _origOpenModal(power);
    updateModalCartBtn();
};

// Inicialização
renderCart();
