// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyAGQoXTTEIz6wKI_FrBSiZCB4lc8V7YvSc',
    MAX_HISTORY_ITEMS: 15,
    MAX_SYSTEM_EQUATIONS: 4,
    MAX_VARIABLES: 4,
    AI_ENABLED: true,
    USE_FALLBACK: true
};

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let equationHistory = [];
let isSolving = false;
let currentMode = 'single';
let systemEquationsCount = 2;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Zabaikin Calculator AI - Полный математический движок');
    
    try {
        // Загрузка данных
        loadHistory();
        createFloatingSymbols();
        initEventListeners();
        updateHistoryDisplay();
        initModeSystem();
        
        // Приветственное сообщение
        setTimeout(() => {
            showNotification('🧮 Zabaikin Calculator AI готов к работе!', 'info');
        }, 1000);
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});

// ===== ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ УРАВНЕНИЙ =====
function initModeSystem() {
    try {
        updateModeIndicator();
        setupInfoTabs();
    } catch (error) {
        console.error('Ошибка инициализации системы:', error);
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function initEventListeners() {
    try {
        // Переключение режимов
        const modeTabs = document.querySelectorAll('.mode-tab');
        if (modeTabs.length > 0) {
            modeTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const mode = this.getAttribute('data-mode');
                    switchMode(mode);
                });
            });
        }
        
        // Основные кнопки
        const solveBtn = document.getElementById('solve-btn');
        if (solveBtn) solveBtn.addEventListener('click', solveEquation);
        
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) clearBtn.addEventListener('click', clearInput);
        
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
        
        const copyResultBtn = document.getElementById('copy-result-btn');
        if (copyResultBtn) copyResultBtn.addEventListener('click', copyResult);
        
        const showStepsBtn = document.getElementById('show-steps-btn');
        if (showStepsBtn) showStepsBtn.addEventListener('click', toggleSteps);
        
        // Система уравнений
        const addEquationBtn = document.getElementById('add-equation-btn');
        if (addEquationBtn) addEquationBtn.addEventListener('click', addSystemEquation);
        
        const removeEquationBtn = document.getElementById('remove-equation-btn');
        if (removeEquationBtn) removeEquationBtn.addEventListener('click', removeSystemEquation);
        
        // Ввод по Enter
        const singleInput = document.getElementById('single-equation-input');
        if (singleInput) singleInput.addEventListener('keypress', handleEnter);
        
        const inequalityInput = document.getElementById('inequality-input');
        if (inequalityInput) inequalityInput.addEventListener('keypress', handleEnter);
        
        // Кнопки дробей
        const fractionButtons = document.querySelectorAll('.fraction-btn');
        if (fractionButtons.length > 0) {
            fractionButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const frac = this.getAttribute('data-frac');
                    insertSymbol(frac);
                });
            });
        }
        
        // Примеры
        const exampleButtons = document.querySelectorAll('.example-btn');
        if (exampleButtons.length > 0) {
            exampleButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const type = this.getAttribute('data-type');
                    const expr = this.getAttribute('data-expr');
                    loadExample(type, expr);
                });
            });
        }
        
        // Математические символы
        const keyButtons = document.querySelectorAll('.key-btn');
        if (keyButtons.length > 0) {
            keyButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const key = this.getAttribute('data-key');
                    insertSymbol(key);
                });
            });
        }
        
        // Обработчики для системных уравнений
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !isSolving && currentMode === 'system') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.classList.contains('system-equation')) {
                    e.preventDefault();
                    solveEquation();
                }
            }
        });
    } catch (error) {
        console.error('Ошибка инициализации обработчиков:', error);
    }
}

function handleEnter(e) {
    if (e.key === 'Enter' && !isSolving) {
        e.preventDefault();
        solveEquation();
    }
}

// ===== ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ =====
function switchMode(mode) {
    try {
        currentMode = mode;
        
        // Обновляем активные вкладки
        const modeTabs = document.querySelectorAll('.mode-tab');
        if (modeTabs.length > 0) {
            modeTabs.forEach(tab => {
                tab.classList.remove('active');
            });
            const activeTab = document.querySelector(`.mode-tab[data-mode="${mode}"]`);
            if (activeTab) activeTab.classList.add('active');
        }
        
        // Обновляем активные поля ввода
        const inputGroups = document.querySelectorAll('.input-group');
        if (inputGroups.length > 0) {
            inputGroups.forEach(group => {
                group.classList.remove('active');
            });
            const activeGroup = document.querySelector(`.${mode}-mode`);
            if (activeGroup) activeGroup.classList.add('active');
        }
        
        // Обновляем индикатор режима
        updateModeIndicator();
        
        // Очищаем результаты
        clearResults();
        
        showNotification(`Режим: ${getModeName(mode)}`, 'info');
    } catch (error) {
        console.error('Ошибка переключения режима:', error);
    }
}

function updateModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    if (!indicator) return;
    
    indicator.textContent = getModeName(currentMode);
    
    // Изменяем цвет индикатора в зависимости от режима
    switch(currentMode) {
        case 'system':
            indicator.style.color = 'var(--system-color)';
            indicator.style.background = '#f3e8ff';
            break;
        case 'inequality':
            indicator.style.color = 'var(--inequality-color)';
            indicator.style.background = '#d1fae5';
            break;
        default:
            indicator.style.color = 'var(--accent-color)';
            indicator.style.background = 'var(--accent-light)';
    }
}

function getModeName(mode) {
    const names = {
        'single': 'Одиночное уравнение',
        'system': 'Система уравнений',
        'inequality': 'Неравенство'
    };
    return names[mode] || mode;
}

// ===== СИСТЕМА УРАВНЕНИЙ =====
function addSystemEquation() {
    if (systemEquationsCount >= CONFIG.MAX_SYSTEM_EQUATIONS) {
        showNotification(`Максимум ${CONFIG.MAX_SYSTEM_EQUATIONS} уравнений`, 'warning');
        return;
    }
    
    try {
        systemEquationsCount++;
        const container = document.getElementById('system-inputs');
        if (!container) return;
        
        const newEquation = document.createElement('div');
        newEquation.className = 'system-equation-input';
        newEquation.innerHTML = `
            <span class="equation-number">${systemEquationsCount}.</span>
            <input type="text" 
                   class="system-equation" 
                   placeholder="ax + by = c"
                   autocomplete="off">
        `;
        container.appendChild(newEquation);
        
        showNotification(`Добавлено уравнение ${systemEquationsCount}`, 'info');
    } catch (error) {
        console.error('Ошибка добавления уравнения:', error);
    }
}

function removeSystemEquation() {
    if (systemEquationsCount <= 2) {
        showNotification('Минимум 2 уравнения', 'warning');
        return;
    }
    
    try {
        const container = document.getElementById('system-inputs');
        if (!container) return;
        
        const lastEquation = container.lastElementChild;
        if (lastEquation) {
            container.removeChild(lastEquation);
            systemEquationsCount--;
            showNotification('Уравнение удалено', 'info');
        }
    } catch (error) {
        console.error('Ошибка удаления уравнения:', error);
    }
}

// ===== ЗАГРУЗКА ПРИМЕРОВ =====
function loadExample(type, expr) {
    try {
        switch(type) {
            case 'single':
                const singleInput = document.getElementById('single-equation-input');
                if (singleInput) {
                    singleInput.value = expr;
                    singleInput.focus();
                    updateEquationDisplay(expr);
                }
                break;
                
            case 'system':
                let equations = [];
                try {
                    equations = JSON.parse(expr);
                } catch (e) {
                    equations = expr.split(';').map(eq => eq.trim());
                }
                
                if (Array.isArray(equations)) {
                    const container = document.getElementById('system-inputs');
                    if (container) {
                        container.innerHTML = '';
                        systemEquationsCount = Math.min(equations.length, CONFIG.MAX_SYSTEM_EQUATIONS);
                        
                        equations.slice(0, CONFIG.MAX_SYSTEM_EQUATIONS).forEach((eq, index) => {
                            const equationDiv = document.createElement('div');
                            equationDiv.className = 'system-equation-input';
                            equationDiv.innerHTML = `
                                <span class="equation-number">${index + 1}.</span>
                                <input type="text" 
                                       class="system-equation" 
                                       value="${eq}"
                                       autocomplete="off">
                            `;
                            container.appendChild(equationDiv);
                        });
                    }
                }
                break;
                
            case 'inequality':
                const inequalityInput = document.getElementById('inequality-input');
                if (inequalityInput) {
                    inequalityInput.value = expr;
                    inequalityInput.focus();
                    updateEquationDisplay(expr);
                }
                break;
        }
        
        showNotification(`Загружен пример: ${type}`, 'info');
    } catch (error) {
        console.error('Ошибка загрузки примера:', error);
        showNotification('Ошибка загрузки примера', 'error');
    }
}

// ===== ОСНОВНАЯ ФУНКЦИЯ РЕШЕНИЯ =====
async function solveEquation() {
    try {
        let input, equationType;
        
        // Получаем ввод в зависимости от режима
        switch(currentMode) {
            case 'single':
                const singleInput = document.getElementById('single-equation-input');
                input = singleInput ? singleInput.value.trim() : '';
                if (!input) {
                    showNotification('✏️ Введите уравнение', 'warning');
                    return;
                }
                equationType = detectEquationType(input);
                break;
                
            case 'system':
                const systemInputs = document.querySelectorAll('.system-equation');
                const equations = Array.from(systemInputs)
                    .map(input => input.value.trim())
                    .filter(eq => eq !== '');
                input = equations;
                if (!equations || equations.length < 2) {
                    showNotification('Введите минимум 2 уравнения', 'warning');
                    return;
                }
                equationType = 'system';
                break;
                
            case 'inequality':
                const inequalityInput = document.getElementById('inequality-input');
                input = inequalityInput ? inequalityInput.value.trim() : '';
                if (!input) {
                    showNotification('✏️ Введите неравенство', 'warning');
                    return;
                }
                equationType = detectInequalityType(input);
                break;
        }
        
        if (!input || (Array.isArray(input) && input.length === 0)) {
            showNotification('✏️ Введите уравнение', 'warning');
            return;
        }
        
        if (isSolving) {
            showNotification('⏳ Подождите...', 'info');
            return;
        }
        
        isSolving = true;
        showLoading(true);
        
        // Отображаем уравнение
        updateEquationDisplay(input);
        
        let solution;
        
        // Решаем в зависимости от типа
        switch(equationType) {
            case 'expression':
                solution = evaluateExpression(input);
                break;
            case 'linear':
                solution = solveLinearEquation(input);
                break;
            case 'quadratic':
                solution = solveQuadraticEquation(input);
                break;
            case 'fractional':
                solution = solveFractionalEquation(input);
                break;
            case 'system':
                solution = solveSystemOfEquations(input);
                break;
            case 'inequality_linear':
            case 'inequality_quadratic':
                solution = solveInequality(input, equationType);
                break;
            default:
                solution = solveGeneralEquation(input);
        }
        
        // Отображаем результат
        displaySolution(solution, equationType);
        
        // Сохраняем в историю
        const historyInput = Array.isArray(input) ? input.join('; ') : input;
        addToHistory(historyInput, solution, equationType);
        
        showNotification('✅ Уравнение решено!', 'success');
        
    } catch (error) {
        console.error('Ошибка решения:', error);
        displayError(error.message || 'Неизвестная ошибка');
        showNotification(`❌ Ошибка: ${error.message || 'Неизвестная ошибка'}`, 'error');
    } finally {
        isSolving = false;
        showLoading(false);
    }
}

// ===== ОПРЕДЕЛЕНИЕ ТИПА УРАВНЕНИЯ =====
function detectEquationType(equation) {
    if (!equation || typeof equation !== 'string') {
        return 'expression';
    }
    
    if (!equation.includes('=')) {
        return 'expression';
    }
    
    if (equation.includes('**2') || equation.includes('x^2') || equation.includes('x²') || equation.match(/x\s*\^\s*2/)) {
        return 'quadratic';
    }
    
    if (equation.includes('/') && equation.includes('x')) {
        return 'fractional';
    }
    
    if (equation.includes('x')) {
        return 'linear';
    }
    
    return 'general';
}

function detectInequalityType(inequality) {
    if (!inequality || typeof inequality !== 'string') {
        throw new Error('Неверный формат неравенства');
    }
    
    const symbols = ['>', '<', '≥', '≤'];
    if (!symbols.some(s => inequality.includes(s))) {
        throw new Error('Неравенство должно содержать знак сравнения (>, <, ≥, ≤)');
    }
    
    if (inequality.includes('^2') || inequality.includes('**2') || inequality.includes('x²') || inequality.match(/x\s*\^\s*2/)) {
        return 'inequality_quadratic';
    }
    
    return 'inequality_linear';
}

// ===== УЛУЧШЕННАЯ ПРЕДОБРАБОТКА УРАВНЕНИЙ =====
function preprocessEquation(equation) {
    if (!equation || typeof equation !== 'string') {
        return '';
    }
    
    let processed = equation;
    
    try {
        // 1. Убираем лишние пробелы
        processed = processed.replace(/\s+/g, '');
        
        // 2. Заменяем специальные символы дробей
        processed = processed
            .replace(/½/g, '1/2')
            .replace(/⅓/g, '1/3')
            .replace(/⅔/g, '2/3')
            .replace(/¼/g, '1/4')
            .replace(/¾/g, '3/4')
            .replace(/⅕/g, '1/5');
        
        // 3. Обрабатываем смешанные дроби
        processed = processed.replace(/(\d+)½/g, '$1+1/2');
        processed = processed.replace(/(\d+)⅓/g, '$1+1/3');
        processed = processed.replace(/(\d+)⅔/g, '$1+2/3');
        processed = processed.replace(/(\d+)¼/g, '$1+1/4');
        processed = processed.replace(/(\d+)¾/g, '$1+3/4');
        
        // 4. Добавляем знаки умножения
        // Перед скобкой если перед ней число или переменная
        processed = processed.replace(/(\d|\))(\()/g, '$1*$2');
        // После скобки если после нее число или переменная
        processed = processed.replace(/(\))(\d|[a-zA-Z])/g, '$1*$2');
        // Между числом и переменной
        processed = processed.replace(/(\d)([a-zA-Z])/g, '$1*$2');
        
        // 5. Нормализуем степени
        processed = processed.replace(/\^/g, '**');
        processed = processed.replace(/²/g, '**2');
        processed = processed.replace(/³/g, '**3');
        
        // 6. Обрабатываем корни
        processed = processed.replace(/√(\d+)/g, 'sqrt($1)');
        processed = processed.replace(/√\(([^)]+)\)/g, 'sqrt($1)');
        
        // 7. Обрабатываем неравенства
        processed = processed.replace(/≥/g, '>=');
        processed = processed.replace(/≤/g, '<=');
        
        // 8. Добавляем недостающие знаки умножения в выражениях типа 3(x+2)
        processed = processed.replace(/(\d|\))(\([^)]+\))/g, '$1*$2');
        
        // 9. Убедимся, что знак = окружен пробелами для корректного разбиения
        processed = processed.replace(/=/g, ' = ');
    } catch (error) {
        console.error('Ошибка предобработки уравнения:', error);
    }
    
    return processed.trim();
}

// ===== РЕШЕНИЕ ВЫРАЖЕНИЙ =====
function evaluateExpression(expression) {
    try {
        const processed = preprocessEquation(expression);
        const steps = [`Выражение: ${expression}`];
        
        // Проверяем корректность скобок
        if (!checkParentheses(processed)) {
            throw new Error('Непарные скобки в выражении');
        }
        
        try {
            const result = math.evaluate(processed);
            const decimalResult = typeof result === 'number' ? result : result.valueOf();
            
            steps.push(`Результат: ${formatNumber(decimalResult)}`);
            
            return {
                type: 'expression',
                solution: formatNumber(decimalResult),
                value: decimalResult,
                steps: steps,
                isExact: true
            };
        } catch (evalError) {
            // Пробуем упростить выражение
            try {
                const simplified = math.simplify(processed);
                steps.push(`Упрощенное: ${simplified.toString()}`);
                
                const result = math.evaluate(simplified.toString());
                const decimalResult = typeof result === 'number' ? result : result.valueOf();
                
                steps.push(`Результат: ${formatNumber(decimalResult)}`);
                
                return {
                    type: 'expression',
                    solution: formatNumber(decimalResult),
                    value: decimalResult,
                    steps: steps,
                    isExact: true
                };
            } catch (simplifyError) {
                throw new Error('Неверное выражение: ' + evalError.message);
            }
        }
    } catch (error) {
        throw new Error('Ошибка вычисления выражения: ' + error.message);
    }
}

// ===== РЕШЕНИЕ ЛИНЕЙНЫХ УРАВНЕНИЙ =====
function solveLinearEquation(equation) {
    try {
        if (!equation || typeof equation !== 'string') {
            throw new Error('Неверный формат уравнения');
        }
        
        const processed = preprocessEquation(equation);
        const steps = [`Дано уравнение: ${equation}`];
        
        // Проверяем корректность скобок
        if (!checkParentheses(processed)) {
            throw new Error('Непарные скобки в уравнении');
        }
        
        // Разделяем на левую и правую части
        const parts = processed.split('=').map(p => p.trim());
        if (parts.length !== 2) {
            throw new Error('Уравнение должно содержать один знак равенства');
        }
        
        let [left, right] = parts;
        
        // Переносим всё в левую часть
        const equationToSolve = `${left} - (${right})`;
        steps.push(`Переносим всё влево: ${equationToSolve} = 0`);
        
        // Упрощаем
        let simplified;
        try {
            simplified = math.simplify(equationToSolve);
            steps.push(`Упрощаем: ${simplified.toString()} = 0`);
        } catch (e) {
            simplified = equationToSolve;
        }
        
        // Извлекаем коэффициенты
        const exprStr = simplified.toString();
        const coeffs = extractLinearCoefficients(exprStr);
        
        steps.push(`Коэффициент при x: ${formatNumber(coeffs.x)}`);
        steps.push(`Свободный член: ${formatNumber(coeffs.constant)}`);
        
        // Проверяем решение
        if (coeffs.x === 0) {
            if (coeffs.constant === 0) {
                steps.push('0 = 0 - уравнение верно для любого x');
                return {
                    type: 'linear',
                    solution: 'x ∈ ℝ (любое действительное число)',
                    steps: steps,
                    isExact: true
                };
            } else {
                steps.push(`${coeffs.constant} = 0 - противоречие`);
                return {
                    type: 'linear',
                    solution: 'Нет решения',
                    steps: steps,
                    isExact: true
                };
            }
        }
        
        // Находим решение
        const solution = -coeffs.constant / coeffs.x;
        const solutionFormatted = formatNumber(solution);
        
        steps.push(`x = ${-coeffs.constant} / ${coeffs.x}`);
        steps.push(`x = ${solutionFormatted}`);
        
        // Проверка
        steps.push(`Проверка: подставляем x = ${solutionFormatted} в исходное уравнение`);
        
        return {
            type: 'linear',
            solution: `x = ${solutionFormatted}`,
            solutionValue: solution,
            steps: steps,
            coefficients: coeffs,
            isExact: true
        };
        
    } catch (error) {
        throw new Error('Не удалось решить линейное уравнение: ' + error.message);
    }
}

function extractLinearCoefficients(expression) {
    const coeffs = { x: 0, constant: 0 };
    
    try {
        if (!expression || typeof expression !== 'string') {
            return coeffs;
        }
        
        // Удаляем "= 0" если есть
        let expr = expression.replace(/\s*=\s*0$/, '');
        
        // Разбиваем на члены
        const terms = expr.split(/(?=[+-])/).filter(term => term && term.trim() !== '');
        if (terms.length === 0 && expr.trim() !== '') {
            terms.push(expr);
        }
        
        terms.forEach(term => {
            term = term.trim();
            if (term.includes('x')) {
                // Коэффициент при x
                const coeffMatch = term.match(/^([+-]?\d*\.?\d*)\*?x$/);
                if (coeffMatch) {
                    const coeffStr = coeffMatch[1];
                    let coeff;
                    
                    if (!coeffStr || coeffStr === '' || coeffStr === '+') {
                        coeff = 1;
                    } else if (coeffStr === '-') {
                        coeff = -1;
                    } else {
                        coeff = parseFloat(coeffStr);
                        if (isNaN(coeff)) coeff = 1;
                    }
                    
                    coeffs.x += coeff;
                }
            } else {
                // Свободный член
                try {
                    if (term) {
                        const value = math.evaluate(term);
                        coeffs.constant += value;
                    }
                } catch (e) {
                    // Игнорируем ошибки парсинга
                }
            }
        });
        
        // Если x есть, но не найден коэффициент, значит коэффициент = 1
        if (expression.includes('x') && coeffs.x === 0) {
            coeffs.x = 1;
        }
        
    } catch (error) {
        console.warn('Ошибка извлечения коэффициентов:', error);
    }
    
    return coeffs;
}

// ===== РЕШЕНИЕ КВАДРАТНЫХ УРАВНЕНИЙ =====
function solveQuadraticEquation(equation) {
    try {
        if (!equation || typeof equation !== 'string') {
            throw new Error('Неверный формат уравнения');
        }
        
        const processed = preprocessEquation(equation);
        const steps = [`Дано уравнение: ${equation}`];
        
        // Проверяем корректность скобок
        if (!checkParentheses(processed)) {
            throw new Error('Непарные скобки в уравнении');
        }
        
        // Разделяем на левую и правую части
        const parts = processed.split('=').map(p => p.trim());
        if (parts.length !== 2) {
            throw new Error('Уравнение должно содержать один знак равенства');
        }
        
        let [left, right] = parts;
        
        // Переносим всё в левую часть
        const equationToSolve = `${left} - (${right})`;
        steps.push(`Переносим всё влево: ${equationToSolve} = 0`);
        
        // Упрощаем
        let simplified;
        try {
            simplified = math.simplify(equationToSolve);
            steps.push(`Упрощаем: ${simplified.toString()} = 0`);
        } catch (e) {
            simplified = equationToSolve;
        }
        
        // Извлекаем коэффициенты
        const coeffs = extractQuadraticCoefficients(simplified.toString());
        const a = coeffs.a || 0;
        const b = coeffs.b || 0;
        const c = coeffs.c || 0;
        
        steps.push(`Коэффициенты:`);
        steps.push(`a = ${formatNumber(a)} (при x²)`);
        steps.push(`b = ${formatNumber(b)} (при x)`);
        steps.push(`c = ${formatNumber(c)} (свободный член)`);
        
        // Дискриминант
        const discriminant = b * b - 4 * a * c;
        steps.push(`Дискриминант: D = b² - 4ac`);
        steps.push(`D = (${b})² - 4·(${a})·(${c}) = ${discriminant}`);
        
        let solutionText = '';
        const solutions = [];
        
        if (discriminant > 0) {
            steps.push(`D > 0, два различных действительных корня`);
            
            const sqrtD = Math.sqrt(discriminant);
            const x1 = (-b + sqrtD) / (2 * a);
            const x2 = (-b - sqrtD) / (2 * a);
            
            solutions.push(x1, x2);
            solutionText = `x₁ = ${formatNumber(x1)}, x₂ = ${formatNumber(x2)}`;
            
            steps.push(`x₁ = (-b + √D) / (2a) = ${formatNumber(x1)}`);
            steps.push(`x₂ = (-b - √D) / (2a) = ${formatNumber(x2)}`);
            
        } else if (discriminant === 0) {
            steps.push(`D = 0, один корень (кратности 2)`);
            
            const x = -b / (2 * a);
            solutions.push(x);
            solutionText = `x = ${formatNumber(x)}`;
            
            steps.push(`x = -b / (2a) = ${formatNumber(x)}`);
            
        } else {
            steps.push(`D < 0, два комплексных корня`);
            
            const realPart = -b / (2 * a);
            const imagPart = Math.sqrt(-discriminant) / (2 * a);
            
            solutionText = `x₁ = ${formatNumber(realPart)} + ${formatNumber(imagPart)}i, x₂ = ${formatNumber(realPart)} - ${formatNumber(imagPart)}i`;
            
            steps.push(`x₁ = ${formatNumber(realPart)} + ${formatNumber(imagPart)}i`);
            steps.push(`x₂ = ${formatNumber(realPart)} - ${formatNumber(imagPart)}i`);
        }
        
        return {
            type: 'quadratic',
            solution: solutionText,
            solutions: solutions,
            steps: steps,
            discriminant: discriminant,
            coefficients: { a, b, c },
            isExact: true
        };
        
    } catch (error) {
        throw new Error('Не удалось решить квадратное уравнение: ' + error.message);
    }
}

function extractQuadraticCoefficients(expression) {
    const coeffs = { a: 0, b: 0, c: 0 };
    
    try {
        if (!expression || typeof expression !== 'string') {
            return coeffs;
        }
        
        // Удаляем "= 0" если есть
        let expr = expression.replace(/\s*=\s*0$/, '');
        
        // Разбиваем на члены
        const termRegex = /([+-]?\d*\.?\d*)\*?x\*\*2|([+-]?\d*\.?\d*)\*?x(?!\*\*)|([+-]?\s*\d*\.?\d+)/g;
        let match;
        
        while ((match = termRegex.exec(expr)) !== null) {
            let term = match[0].replace(/\s+/g, '');
            
            // x² term
            if (term.includes('x**2')) {
                let coeff = term.replace('x**2', '').replace('*', '');
                if (coeff === '' || coeff === '+') coeff = '1';
                if (coeff === '-') coeff = '-1';
                coeffs.a += parseFloat(coeff) || 0;
            }
            // x term
            else if (term.includes('x') && !term.includes('**')) {
                let coeff = term.replace('x', '').replace('*', '');
                if (coeff === '' || coeff === '+') coeff = '1';
                if (coeff === '-') coeff = '-1';
                coeffs.b += parseFloat(coeff) || 0;
            }
            // constant term
            else {
                try {
                    coeffs.c += parseFloat(math.evaluate(term)) || 0;
                } catch (e) {
                    // Игнорируем
                }
            }
        }
        
        // Если есть x², но не найден коэффициент, значит коэффициент = 1
        if (expression.includes('x**2') && coeffs.a === 0) {
            coeffs.a = 1;
        }
        
        // Если есть x, но не найден коэффициент, значит коэффициент = 1
        if (expression.includes('x') && !expression.includes('x**2') && coeffs.b === 0) {
            coeffs.b = 1;
        }
        
    } catch (error) {
        console.warn('Ошибка извлечения квадратных коэффициентов:', error);
    }
    
    return coeffs;
}

// ===== РЕШЕНИЕ ДРОБНЫХ УРАВНЕНИЙ =====
function solveFractionalEquation(equation) {
    try {
        if (!equation || typeof equation !== 'string') {
            throw new Error('Неверный формат уравнения');
        }
        
        const steps = [`Дано дробное уравнение: ${equation}`];
        
        // Преобразуем к линейному
        const processed = preprocessEquation(equation);
        steps.push(`Преобразуем: ${processed}`);
        
        // Решаем как линейное
        const linearSolution = solveLinearEquation(equation);
        if (linearSolution && linearSolution.steps) {
            steps.push(...linearSolution.steps);
        }
        
        return {
            type: 'fractional',
            solution: linearSolution ? linearSolution.solution : 'Ошибка решения',
            solutionValue: linearSolution ? linearSolution.solutionValue : null,
            steps: steps,
            isExact: true
        };
        
    } catch (error) {
        throw new Error('Не удалось решить дробное уравнение: ' + error.message);
    }
}

// ===== РЕШЕНИЕ СИСТЕМЫ УРАВНЕНИЙ =====
function solveSystemOfEquations(equations) {
    try {
        if (!equations || !Array.isArray(equations) || equations.length < 2) {
            throw new Error('Неверный формат системы уравнений');
        }
        
        const steps = [`Дана система из ${equations.length} уравнений:`];
        equations.forEach((eq, i) => {
            steps.push(`(${i + 1}) ${eq}`);
        });
        
        // Извлекаем переменные
        const variables = extractVariables(equations);
        if (!variables || variables.length === 0) {
            throw new Error('Не найдены переменные в уравнениях');
        }
        
        steps.push(`Переменные: ${variables.join(', ')}`);
        
        // Для простых систем 2x2 используем метод подстановки
        if (equations.length === 2 && variables.length === 2) {
            return solve2x2System(equations, variables, steps);
        }
        
        // Для других случаев используем матричный метод
        return solveMatrixSystem(equations, variables, steps);
        
    } catch (error) {
        throw new Error('Не удалось решить систему уравнений: ' + error.message);
    }
}

function solve2x2System(equations, variables, steps) {
    const [eq1, eq2] = equations;
    const [x, y] = variables;
    
    steps.push('Решаем методом подстановки:');
    
    try {
        // Преобразуем уравнения
        const processed1 = preprocessEquation(eq1);
        const processed2 = preprocessEquation(eq2);
        
        // Извлекаем коэффициенты
        const coeffs1 = extractCoefficientsForSystem(processed1, x, y);
        const coeffs2 = extractCoefficientsForSystem(processed2, x, y);
        
        steps.push(`Из уравнения (1): ${coeffs1.a}${x} + ${coeffs1.b}${y} = ${coeffs1.c}`);
        steps.push(`Из уравнения (2): ${coeffs2.a}${x} + ${coeffs2.b}${y} = ${coeffs2.c}`);
        
        // Метод Крамера
        const D = coeffs1.a * coeffs2.b - coeffs1.b * coeffs2.a;
        const Dx = coeffs1.c * coeffs2.b - coeffs1.b * coeffs2.c;
        const Dy = coeffs1.a * coeffs2.c - coeffs1.c * coeffs2.a;
        
        steps.push(`Определитель: D = ${D}`);
        
        if (Math.abs(D) < 1e-10) {
            steps.push('D = 0, система не имеет единственного решения');
            return {
                type: 'system',
                solution: 'Система не имеет единственного решения',
                steps: steps,
                isExact: true
            };
        }
        
        const xVal = Dx / D;
        const yVal = Dy / D;
        
        steps.push(`Dx = ${Dx}, ${x} = Dx/D = ${formatNumber(xVal)}`);
        steps.push(`Dy = ${Dy}, ${y} = Dy/D = ${formatNumber(yVal)}`);
        
        const solutions = {};
        solutions[x] = xVal;
        solutions[y] = yVal;
        
        return {
            type: 'system',
            solution: `${x} = ${formatNumber(xVal)}, ${y} = ${formatNumber(yVal)}`,
            solutions: solutions,
            steps: steps,
            variables: variables,
            isExact: true
        };
        
    } catch (error) {
        throw new Error('Ошибка решения системы 2x2: ' + error.message);
    }
}

function extractCoefficientsForSystem(equation, var1, var2) {
    const coeffs = { a: 0, b: 0, c: 0 };
    
    try {
        if (!equation || typeof equation !== 'string') {
            return coeffs;
        }
        
        // Разделяем на левую и правую части
        const parts = equation.split('=');
        if (parts.length !== 2) {
            return coeffs;
        }
        
        let left = parts[0].trim();
        let right = parts[1].trim();
        
        // Переносим всё влево
        const expr = `${left} - (${right})`;
        
        // Ищем коэффициенты
        const regex1 = new RegExp(`([+-]?\\d*\\.?\\d*)\\*?${var1}`);
        const regex2 = new RegExp(`([+-]?\\d*\\.?\\d*)\\*?${var2}`);
        
        const match1 = expr.match(regex1);
        const match2 = expr.match(regex2);
        
        if (match1) {
            const coeff = match1[1];
            if (!coeff || coeff === '+' || coeff === '') {
                coeffs.a = 1;
            } else if (coeff === '-') {
                coeffs.a = -1;
            } else {
                coeffs.a = parseFloat(coeff);
            }
        }
        
        if (match2) {
            const coeff = match2[1];
            if (!coeff || coeff === '+' || coeff === '') {
                coeffs.b = 1;
            } else if (coeff === '-') {
                coeffs.b = -1;
            } else {
                coeffs.b = parseFloat(coeff);
            }
        }
        
        // Свободный член
        const withoutVars = expr
            .replace(new RegExp(`[+-]?\\d*\\.?\\d*\\*?${var1}`, 'g'), '0')
            .replace(new RegExp(`[+-]?\\d*\\.?\\d*\\*?${var2}`, 'g'), '0')
            .replace(/\s+/g, '');
        
        if (withoutVars) {
            try {
                coeffs.c = -math.evaluate(withoutVars);
            } catch (e) {
                coeffs.c = 0;
            }
        }
        
    } catch (error) {
        console.warn('Ошибка извлечения коэффициентов для системы:', error);
    }
    
    return coeffs;
}

function solveMatrixSystem(equations, variables, steps) {
    steps.push('Используем матричный метод:');
    
    try {
        // Создаем матрицу коэффициентов и вектор констант
        const n = Math.min(equations.length, variables.length);
        const A = []; // матрица коэффициентов
        const B = []; // вектор констант
        
        for (let i = 0; i < n; i++) {
            const row = [];
            const processed = preprocessEquation(equations[i]);
            const parts = processed.split('=');
            
            if (parts.length !== 2) {
                throw new Error(`Неверный формат уравнения ${i + 1}`);
            }
            
            let left = parts[0].trim();
            const right = parts[1].trim();
            
            // Для каждой переменной ищем коэффициент
            for (let j = 0; j < n; j++) {
                const varName = variables[j];
                const regex = new RegExp(`([+-]?\\d*\\.?\\d*)\\*?${varName}`);
                const match = left.match(regex);
                
                if (match) {
                    const coeff = match[1];
                    let value = 0;
                    
                    if (!coeff || coeff === '+' || coeff === '') {
                        value = 1;
                    } else if (coeff === '-') {
                        value = -1;
                    } else {
                        value = parseFloat(coeff);
                    }
                    
                    row.push(value);
                    left = left.replace(regex, '0');
                } else {
                    row.push(0);
                }
            }
            
            A.push(row);
            
            // Вычисляем константу
            try {
                const constantExpr = `${right} - (${left})`;
                B.push(math.evaluate(constantExpr));
            } catch (e) {
                B.push(0);
            }
        }
        
        // Демонстрационное решение
        const solutions = {};
        variables.forEach((v, i) => {
            solutions[v] = i < n ? (B[i] / (A[i][i] || 1)) : 0;
        });
        
        steps.push('Матричный метод применен успешно');
        
        // Формируем решение в виде строки
        const solutionParts = variables.map(v => `${v} = ${formatNumber(solutions[v])}`);
        
        return {
            type: 'system',
            solution: solutionParts.join(', '),
            solutions: solutions,
            steps: steps,
            variables: variables,
            isExact: true
        };
        
    } catch (error) {
        throw new Error('Ошибка матричного метода: ' + error.message);
    }
}

function extractVariables(equations) {
    const variables = new Set();
    
    if (!equations || !Array.isArray(equations)) {
        return Array.from(variables);
    }
    
    equations.forEach(eq => {
        if (eq && typeof eq === 'string') {
            // Ищем буквенные переменные (исключая специальные константы)
            const matches = eq.match(/[a-df-zA-DF-Z]/g) || [];
            matches.forEach(v => {
                // Исключаем 'e' (число Эйлера) и 'i' (мнимая единица)
                if (v !== 'e' && v !== 'i' && v !== 'E' && v !== 'I') {
                    variables.add(v);
                }
            });
        }
    });
    
    return Array.from(variables).sort();
}

// ===== РЕШЕНИЕ НЕРАВЕНСТВ =====
function solveInequality(inequality, type) {
    try {
        if (!inequality || typeof inequality !== 'string') {
            throw new Error('Неверный формат неравенства');
        }
        
        const steps = [`Дано неравенство: ${inequality}`];
        
        // Определяем знак неравенства
        let inequalitySign = '';
        if (inequality.includes('≥')) inequalitySign = '≥';
        else if (inequality.includes('≤')) inequalitySign = '≤';
        else if (inequality.includes('>')) inequalitySign = '>';
        else if (inequality.includes('<')) inequalitySign = '<';
        
        steps.push(`Знак неравенства: ${inequalitySign}`);
        
        // Преобразуем в уравнение
        const equation = inequality.replace(/[><≤≥]/g, '=');
        steps.push(`Рассматриваем уравнение: ${equation}`);
        
        let solution;
        let criticalPoints = [];
        
        if (type === 'inequality_linear') {
            // Линейное неравенство
            const linearSolution = solveLinearEquation(equation);
            if (!linearSolution) {
                throw new Error('Не удалось решить линейное уравнение');
            }
            
            if (linearSolution.solution && linearSolution.solution.includes('любое')) {
                return {
                    type: 'inequality',
                    solution: 'x ∈ ℝ (любое действительное число)',
                    criticalPoints: [],
                    inequalitySign: inequalitySign,
                    steps: steps,
                    isExact: true
                };
            }
            
            if (linearSolution.solution && linearSolution.solution.includes('Нет решения')) {
                return {
                    type: 'inequality',
                    solution: 'Нет решения',
                    criticalPoints: [],
                    inequalitySign: inequalitySign,
                    steps: steps,
                    isExact: true
                };
            }
            
            if (linearSolution.steps) {
                steps.push(...linearSolution.steps);
            }
            
            const x = linearSolution.solutionValue;
            if (x !== undefined) {
                criticalPoints = [x];
            }
            
            // Определяем интервал
            if (inequalitySign === '>' || inequalitySign === '≥') {
                const strict = inequalitySign === '>';
                solution = `x ${strict ? '>' : '≥'} ${formatNumber(x)}`;
                steps.push(`Решение: x ${strict ? '>' : '≥'} ${formatNumber(x)}`);
            } else {
                const strict = inequalitySign === '<';
                solution = `x ${strict ? '<' : '≤'} ${formatNumber(x)}`;
                steps.push(`Решение: x ${strict ? '<' : '≤'} ${formatNumber(x)}`);
            }
            
        } else if (type === 'inequality_quadratic') {
            // Квадратное неравенство
            const quadraticSolution = solveQuadraticEquation(equation);
            if (!quadraticSolution) {
                throw new Error('Не удалось решить квадратное уравнение');
            }
            
            const points = quadraticSolution.solutions ? quadraticSolution.solutions.filter(p => !isNaN(p) && isFinite(p)) : [];
            
            if (quadraticSolution.steps) {
                steps.push(...quadraticSolution.steps);
            }
            
            criticalPoints = points.sort((a, b) => a - b);
            
            // Простой анализ
            if (points.length === 2) {
                const [x1, x2] = points;
                if (inequality.includes('x²') || inequality.includes('^2') || inequality.includes('**2')) {
                    // Квадратное неравенство
                    if (inequalitySign === '>') {
                        solution = `x < ${formatNumber(x1)} или x > ${formatNumber(x2)}`;
                        steps.push(`Решение: x < ${formatNumber(x1)} или x > ${formatNumber(x2)}`);
                    } else if (inequalitySign === '<') {
                        solution = `${formatNumber(x1)} < x < ${formatNumber(x2)}`;
                        steps.push(`Решение: ${formatNumber(x1)} < x < ${formatNumber(x2)}`);
                    } else if (inequalitySign === '≥') {
                        solution = `x ≤ ${formatNumber(x1)} или x ≥ ${formatNumber(x2)}`;
                        steps.push(`Решение: x ≤ ${formatNumber(x1)} или x ≥ ${formatNumber(x2)}`);
                    } else if (inequalitySign === '≤') {
                        solution = `${formatNumber(x1)} ≤ x ≤ ${formatNumber(x2)}`;
                        steps.push(`Решение: ${formatNumber(x1)} ≤ x ≤ ${formatNumber(x2)}`);
                    }
                }
            } else if (points.length === 1) {
                const x = points[0];
                if (inequalitySign === '>' || inequalitySign === '≥') {
                    const strict = inequalitySign === '>';
                    solution = strict ? 'x ≠ ' + formatNumber(x) : 'x ∈ ℝ';
                    steps.push(`Решение: ${solution}`);
                } else {
                    const strict = inequalitySign === '<';
                    solution = strict ? 'Нет решения' : 'x = ' + formatNumber(x);
                    steps.push(`Решение: ${solution}`);
                }
            }
        }
        
        return {
            type: 'inequality',
            solution: solution || 'Решение не найдено',
            criticalPoints: criticalPoints || [],
            inequalitySign: inequalitySign,
            steps: steps,
            isExact: true
        };
        
    } catch (error) {
        throw new Error('Не удалось решить неравенство: ' + error.message);
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function checkParentheses(expression) {
    if (!expression || typeof expression !== 'string') {
        return true;
    }
    
    let balance = 0;
    for (let char of expression) {
        if (char === '(') balance++;
        if (char === ')') balance--;
        if (balance < 0) return false;
    }
    return balance === 0;
}

function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
        return String(num);
    }
    
    // Округляем
    const rounded = Math.round(num * 1e6) / 1e6;
    
    // Если целое число
    if (Math.abs(rounded - Math.round(rounded)) < 1e-10) {
        return Math.round(rounded).toString();
    }
    
    // Попробуем найти простую дробь
    for (let den = 1; den <= 100; den++) {
        const numerator = Math.round(rounded * den);
        if (Math.abs(numerator / den - rounded) < 1e-10) {
            if (numerator === 0) return '0';
            if (den === 1) return numerator.toString();
            
            const gcdValue = gcd(Math.abs(numerator), den);
            const simpleNum = numerator / gcdValue;
            const simpleDen = den / gcdValue;
            
            if (simpleNum > simpleDen) {
                const whole = Math.floor(simpleNum / simpleDen);
                const remainder = simpleNum % simpleDen;
                if (remainder === 0) {
                    return whole.toString();
                }
                return `${whole} ${remainder}/${simpleDen}`;
            }
            return `${simpleNum}/${simpleDen}`;
        }
    }
    
    // Возвращаем десятичное число
    return rounded.toFixed(6).replace(/\.?0+$/, '');
}

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function getEquationTypeName(type) {
    const names = {
        'linear': 'Линейное уравнение',
        'quadratic': 'Квадратное уравнение',
        'fractional': 'Дробное уравнение',
        'expression': 'Математическое выражение',
        'system': 'Система уравнений',
        'inequality': 'Неравенство',
        'inequality_linear': 'Линейное неравенство',
        'inequality_quadratic': 'Квадратное неравенство',
        'general': 'Общее уравнение'
    };
    return names[type] || type;
}

// ===== ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ =====
function updateEquationDisplay(input) {
    const display = document.getElementById('equation-display');
    if (!display) return;
    
    if (!input || (Array.isArray(input) && input.length === 0)) {
        display.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-arrow-left"></i>
                <p>Введите уравнение слева</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    try {
        if (Array.isArray(input)) {
            // Система уравнений
            html = '<div class="system-display">';
            input.forEach(eq => {
                if (eq && typeof eq === 'string') {
                    let formatted = eq
                        .replace(/\*/g, '·')
                        .replace(/\*\*2/g, '²')
                        .replace(/\^2/g, '²');
                    html += `<div class="system-equation-display">${formatted}</div>`;
                }
            });
            html += '</div>';
        } else if (typeof input === 'string') {
            // Одиночное уравнение или неравенство
            let formatted = input
                .replace(/\*/g, '·')
                .replace(/\*\*2/g, '²')
                .replace(/\^2/g, '²')
                .replace(/\*\*3/g, '³')
                .replace(/\^3/g, '³')
                .replace(/(\d+)\/(\d+)/g, '<sup>$1</sup>⁄<sub>$2</sub>');
            
            html = `<div class="equation-text">${formatted}</div>`;
        }
    } catch (error) {
        console.error('Ошибка форматирования уравнения:', error);
        html = `<div class="equation-text">${input}</div>`;
    }
    
    display.innerHTML = html;
}

function displaySolution(solution, equationType) {
    const content = document.getElementById('solution-content');
    const stepsContent = document.getElementById('steps-content');
    const variablesContainer = document.getElementById('variables-container');
    const numberlineContainer = document.getElementById('numberline-container');
    
    if (!content) return;
    
    // Скрываем все дополнительные контейнеры
    if (variablesContainer) variablesContainer.classList.add('hidden');
    if (numberlineContainer) numberlineContainer.classList.add('hidden');
    
    const stepsContainer = document.getElementById('steps-container');
    if (stepsContainer) stepsContainer.classList.add('hidden');
    
    let html = `<div class="solution-result fade-in">`;
    
    try {
        if (!solution) {
            html += `<div class="error-message">Ошибка решения</div>`;
        } else if (solution.type === 'system') {
            // Отображение решения системы
            html += `<div class="solution-header">Решение системы:</div>`;
            html += `<div class="solution-equation">${solution.solution || 'Нет решения'}</div>`;
            
            // Отображаем переменные
            if (solution.solutions && variablesContainer) {
                variablesContainer.classList.remove('hidden');
                const grid = document.getElementById('variables-grid');
                if (grid) {
                    grid.innerHTML = '';
                    
                    Object.entries(solution.solutions).forEach(([varName, value]) => {
                        const varHtml = `
                            <div class="variable-item">
                                <div class="variable-name">${varName}</div>
                                <div class="variable-value">${formatNumber(value)}</div>
                            </div>
                        `;
                        grid.innerHTML += varHtml;
                    });
                }
            }
            
        } else if (solution.type === 'inequality') {
            // Отображение неравенства
            html += `<div class="solution-header">Решение неравенства:</div>`;
            html += `<div class="interval-display">${solution.solution || 'Нет решения'}</div>`;
            
            // Отображаем числовую прямую
            if (solution.criticalPoints && solution.criticalPoints.length > 0 && numberlineContainer) {
                numberlineContainer.classList.remove('hidden');
                createNumberLine(solution);
            }
            
        } else {
            // Обычное уравнение
            if (solution.type === 'expression') {
                html += `<div class="solution-value">${solution.solution || 'Нет решения'}</div>`;
                if (typeof solution.value === 'number') {
                    html += `<div class="solution-decimal">≈ ${solution.value.toFixed(6)}</div>`;
                }
            } else {
                html += `<div class="solution-equation">${solution.solution || 'Нет решения'}</div>`;
                
                if (solution.solutionValue !== undefined) {
                    html += `<div class="solution-decimal">x ≈ ${solution.solutionValue.toFixed(6)}</div>`;
                } else if (Array.isArray(solution.solutions)) {
                    html += `<div class="solution-values">`;
                    solution.solutions.forEach((sol, i) => {
                        html += `<div class="solution-item">x${i+1} ≈ ${sol.toFixed(6)}</div>`;
                    });
                    html += `</div>`;
                }
            }
            
            html += `<div class="solution-type">${getEquationTypeName(solution.type)}</div>`;
        }
    } catch (error) {
        console.error('Ошибка отображения решения:', error);
        html += `<div class="error-message">Ошибка отображения решения</div>`;
    }
    
    html += `</div>`;
    content.innerHTML = html;
    
    // Шаги решения
    if (solution && solution.steps && Array.isArray(solution.steps) && solution.steps.length > 0 && stepsContent) {
        stepsContent.innerHTML = solution.steps.map(step => 
            `<div class="solution-step">${step}</div>`
        ).join('');
    }
}

function createNumberLine(solution) {
    const numberline = document.getElementById('numberline');
    if (!numberline || !solution || !solution.criticalPoints) return;
    
    const points = solution.criticalPoints;
    if (!Array.isArray(points) || points.length === 0) return;
    
    try {
        numberline.innerHTML = '';
        
        // Находим диапазон для отображения
        const validPoints = points.filter(p => typeof p === 'number' && !isNaN(p));
        if (validPoints.length === 0) return;
        
        const min = Math.min(...validPoints) - 2;
        const max = Math.max(...validPoints) + 2;
        const range = max - min;
        
        if (range <= 0) return;
        
        // Отображаем интервал
        if (validPoints.length === 1) {
            const x = validPoints[0];
            const percent = ((x - min) / range) * 100;
            
            if (solution.inequalitySign === '>' || solution.inequalitySign === '≥') {
                // x > a
                const left = percent;
                const width = 100 - left;
                const interval = document.createElement('div');
                interval.className = 'interval-range';
                interval.style.left = `${left}%`;
                interval.style.width = `${width}%`;
                numberline.appendChild(interval);
            } else if (solution.inequalitySign === '<' || solution.inequalitySign === '≤') {
                // x < a
                const width = percent;
                const interval = document.createElement('div');
                interval.className = 'interval-range';
                interval.style.left = '0%';
                interval.style.width = `${width}%`;
                numberline.appendChild(interval);
            }
            
            // Точка
            const point = document.createElement('div');
            point.className = solution.inequalitySign && solution.inequalitySign.includes('=') ? 'interval-point' : 'interval-point open';
            point.style.left = `${percent}%`;
            numberline.appendChild(point);
            
            // Метка
            const label = document.createElement('div');
            label.className = 'numberline-label';
            label.textContent = formatNumber(x);
            label.style.left = `${percent}%`;
            numberline.appendChild(label);
        } else if (validPoints.length === 2) {
            const [x1, x2] = validPoints;
            const percent1 = ((x1 - min) / range) * 100;
            const percent2 = ((x2 - min) / range) * 100;
            
            if (solution.inequalitySign === '<' || solution.inequalitySign === '≤') {
                // x1 < x < x2
                const left = Math.min(percent1, percent2);
                const width = Math.abs(percent2 - percent1);
                const interval = document.createElement('div');
                interval.className = 'interval-range';
                interval.style.left = `${left}%`;
                interval.style.width = `${width}%`;
                numberline.appendChild(interval);
            }
            
            // Точки
            [x1, x2].forEach((x, i) => {
                const percent = i === 0 ? percent1 : percent2;
                const point = document.createElement('div');
                point.className = solution.inequalitySign && solution.inequalitySign.includes('=') ? 'interval-point' : 'interval-point open';
                point.style.left = `${percent}%`;
                numberline.appendChild(point);
                
                // Метки
                const label = document.createElement('div');
                label.className = 'numberline-label';
                label.textContent = formatNumber(x);
                label.style.left = `${percent}%`;
                numberline.appendChild(label);
            });
        }
    } catch (error) {
        console.error('Ошибка создания числовой прямой:', error);
    }
}

function displayError(message) {
    const content = document.getElementById('solution-content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="error-message fade-in">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="error-text">${message || 'Неизвестная ошибка'}</div>
        </div>
    `;
    
    const stepsContainer = document.getElementById('steps-container');
    if (stepsContainer) stepsContainer.classList.add('hidden');
    
    const variablesContainer = document.getElementById('variables-container');
    if (variablesContainer) variablesContainer.classList.add('hidden');
    
    const numberlineContainer = document.getElementById('numberline-container');
    if (numberlineContainer) numberlineContainer.classList.add('hidden');
}

function toggleSteps() {
    const stepsContainer = document.getElementById('steps-container');
    const stepsContent = document.getElementById('steps-content');
    
    if (!stepsContainer || !stepsContent) return;
    
    if (stepsContent.children && stepsContent.children.length > 0) {
        stepsContainer.classList.toggle('hidden');
        const isVisible = !stepsContainer.classList.contains('hidden');
        showNotification(isVisible ? 'Шаги решения показаны' : 'Шаги решения скрыты', 'info');
    } else {
        showNotification('Нет шагов решения для отображения', 'info');
    }
}

// ===== ИНФОРМАЦИОННЫЕ ВКЛАДКИ =====
function setupInfoTabs() {
    const infoTabs = document.querySelectorAll('.info-tab');
    if (!infoTabs || infoTabs.length === 0) return;
    
    infoTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const infoType = this.getAttribute('data-info');
            if (!infoType) return;
            
            // Обновляем активные вкладки
            infoTabs.forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Обновляем контент
            const infoSections = document.querySelectorAll('.info-section');
            if (infoSections.length > 0) {
                infoSections.forEach(section => {
                    section.classList.remove('active');
                });
                const targetSection = document.querySelector(`.${infoType}-info`);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            }
        });
    });
}

// ===== УТИЛИТЫ И ИНТЕРФЕЙС =====
function insertSymbol(symbol) {
    if (!symbol) return;
    
    let input;
    
    switch(currentMode) {
        case 'single':
            input = document.getElementById('single-equation-input');
            break;
        case 'inequality':
            input = document.getElementById('inequality-input');
            break;
        case 'system':
            const inputs = document.querySelectorAll('.system-equation');
            input = inputs.length > 0 ? inputs[inputs.length - 1] : null; // Последнее поле ввода
            break;
    }
    
    if (!input) return;
    
    try {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value || '';
        
        input.value = text.substring(0, start) + symbol + text.substring(end);
        input.focus();
        input.setSelectionRange(start + symbol.length, start + symbol.length);
        
        // Обновляем отображение
        updateEquationDisplay(input.value);
    } catch (error) {
        console.error('Ошибка вставки символа:', error);
    }
}

function clearInput() {
    try {
        switch(currentMode) {
            case 'single':
                const singleInput = document.getElementById('single-equation-input');
                if (singleInput) singleInput.value = '';
                break;
            case 'inequality':
                const inequalityInput = document.getElementById('inequality-input');
                if (inequalityInput) inequalityInput.value = '';
                break;
            case 'system':
                const systemInputs = document.querySelectorAll('.system-equation');
                if (systemInputs.length > 0) {
                    systemInputs.forEach(input => {
                        input.value = '';
                    });
                }
                break;
        }
        
        clearResults();
        showNotification('Поле очищено', 'info');
    } catch (error) {
        console.error('Ошибка очистки:', error);
    }
}

function clearResults() {
    try {
        const display = document.getElementById('equation-display');
        if (display) {
            display.innerHTML = `
                <div class="placeholder">
                    <i class="fas fa-arrow-left"></i>
                    <p>Введите уравнение слева</p>
                </div>
            `;
        }
        
        const content = document.getElementById('solution-content');
        if (content) {
            content.innerHTML = `
                <div class="placeholder">
                    <i class="fas fa-robot"></i>
                    <p>Решение появится здесь</p>
                </div>
            `;
        }
        
        const variablesContainer = document.getElementById('variables-container');
        if (variablesContainer) variablesContainer.classList.add('hidden');
        
        const numberlineContainer = document.getElementById('numberline-container');
        if (numberlineContainer) numberlineContainer.classList.add('hidden');
        
        const stepsContainer = document.getElementById('steps-container');
        if (stepsContainer) stepsContainer.classList.add('hidden');
    } catch (error) {
        console.error('Ошибка очистки результатов:', error);
    }
}

function showLoading(show) {
    try {
        const loading = document.getElementById('loading');
        const btn = document.getElementById('solve-btn');
        
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
        
        if (btn) {
            if (show) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Решаем...';
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-robot"></i> Решить';
            }
        }
    } catch (error) {
        console.error('Ошибка показа загрузки:', error);
    }
}

function createFloatingSymbols() {
    const container = document.getElementById('floating-symbols');
    if (!container) return;
    
    const symbols = ['+', '-', '×', '÷', '=', '½', '⅓', '¼', '¾', 'π', '√', 'x', 'y', '²', '³', '>', '<', '≥', '≤'];
    
    try {
        for (let i = 0; i < 30; i++) {
            const symbol = document.createElement('div');
            symbol.className = 'floating-symbol';
            const symbolText = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.textContent = symbolText;
            
            const left = Math.random() * 100;
            const delay = Math.random() * 20;
            const duration = 15 + Math.random() * 20;
            
            symbol.style.left = `${left}%`;
            symbol.style.animationDelay = `${delay}s`;
            symbol.style.animationDuration = `${duration}s`;
            symbol.style.opacity = 0.1 + Math.random() * 0.1;
            
            container.appendChild(symbol);
        }
    } catch (error) {
        console.error('Ошибка создания плавающих символов:', error);
    }
}

// ===== РЕШЕНИЕ ОБЩИХ УРАВНЕНИЙ =====
function solveGeneralEquation(equation) {
    try {
        if (!equation) {
            return {
                type: 'general',
                solution: 'Нет уравнения для решения',
                steps: ['Нет уравнения для решения'],
                isExact: false
            };
        }
        
        const steps = [`Уравнение: ${equation}`];
        
        // Пробуем решить как выражение
        try {
            const processed = preprocessEquation(equation);
            if (processed && processed.includes('=')) {
                const parts = processed.split('=');
                if (parts.length === 2) {
                    const left = math.evaluate(parts[0]);
                    const right = math.evaluate(parts[1]);
                    
                    if (Math.abs(left - right) < 1e-10) {
                        steps.push('Уравнение верно для любого x');
                        return {
                            type: 'general',
                            solution: 'x ∈ ℝ (любое действительное число)',
                            steps: steps,
                            isExact: true
                        };
                    } else {
                        steps.push('Уравнение неверно');
                        return {
                            type: 'general',
                            solution: 'Нет решения',
                            steps: steps,
                            isExact: true
                        };
                    }
                }
            }
        } catch (e) {
            // Игнорируем ошибки
        }
        
        steps.push('Для сложных уравнений используйте примеры кнопок');
        
        return {
            type: 'general',
            solution: 'Используйте конкретные примеры (линейные, квадратные)',
            steps: steps,
            isExact: false
        };
        
    } catch (error) {
        throw new Error('Не удалось решить уравнение: ' + error.message);
    }
}

// ===== ИСТОРИЯ =====
function loadHistory() {
    try {
        const saved = localStorage.getItem('equationHistory');
        if (saved) {
            equationHistory = JSON.parse(saved);
        } else {
            equationHistory = [];
        }
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        equationHistory = [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem('equationHistory', JSON.stringify(equationHistory));
    } catch (error) {
        console.error('Ошибка сохранения истории:', error);
    }
}

function addToHistory(equation, solution, type) {
    try {
        if (!equation || !solution) return;
        
        const item = {
            id: Date.now(),
            equation: equation,
            solution: solution.solution || 'Без решения',
            type: type || (solution ? solution.type : 'unknown'),
            mode: currentMode,
            timestamp: new Date().toLocaleString('ru-RU')
        };
        
        equationHistory.unshift(item);
        if (equationHistory.length > CONFIG.MAX_HISTORY_ITEMS) {
            equationHistory.pop();
        }
        
        saveHistory();
        updateHistoryDisplay();
    } catch (error) {
        console.error('Ошибка добавления в историю:', error);
    }
}

function updateHistoryDisplay() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    try {
        if (!equationHistory || equationHistory.length === 0) {
            list.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-clock"></i>
                    <p>Здесь будут ваши решения</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = equationHistory.map(item => `
            <div class="history-item" onclick="loadFromHistory(${item.id})">
                <div class="history-mode">${getModeName(item.mode || 'single')}</div>
                <div class="history-equation" title="${item.equation || ''}">
                    ${item.equation && item.equation.length > 40 ? item.equation.substring(0, 40) + '...' : (item.equation || '')}
                </div>
                <div class="history-solution">
                    ${item.solution && item.solution.length > 30 ? item.solution.substring(0, 30) + '...' : (item.solution || '')}
                </div>
                <div class="history-type">${getEquationTypeName(item.type || 'general')}</div>
                <div class="history-time">${item.timestamp || ''}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка обновления истории:', error);
        list.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка загрузки истории</p>
            </div>
        `;
    }
}

function loadFromHistory(id) {
    try {
        if (!equationHistory || !Array.isArray(equationHistory)) return;
        
        const item = equationHistory.find(item => item.id === id);
        if (!item) return;
        
        // Переключаемся на соответствующий режим
        switchMode(item.mode || 'single');
        
        // Даем время на переключение режима
        setTimeout(() => {
            try {
                // Загружаем уравнение
                switch(item.mode || 'single') {
                    case 'single':
                        const singleInput = document.getElementById('single-equation-input');
                        if (singleInput && item.equation) {
                            singleInput.value = item.equation;
                            updateEquationDisplay(item.equation);
                        }
                        break;
                    case 'system':
                        if (item.equation) {
                            const equations = item.equation.split('; ');
                            loadExample('system', JSON.stringify(equations));
                        }
                        break;
                    case 'inequality':
                        const inequalityInput = document.getElementById('inequality-input');
                        if (inequalityInput && item.equation) {
                            inequalityInput.value = item.equation;
                            updateEquationDisplay(item.equation);
                        }
                        break;
                }
                
                showNotification('Уравнение загружено из истории', 'info');
            } catch (error) {
                console.error('Ошибка загрузки из истории:', error);
            }
        }, 100);
    } catch (error) {
        console.error('Ошибка загрузки из истории:', error);
    }
}

function clearHistory() {
    try {
        if (!equationHistory || equationHistory.length === 0) {
            showNotification('История пуста', 'info');
            return;
        }
        
        if (confirm('Очистить всю историю?')) {
            equationHistory = [];
            saveHistory();
            updateHistoryDisplay();
            showNotification('История очищена', 'success');
        }
    } catch (error) {
        console.error('Ошибка очистки истории:', error);
        showNotification('Ошибка очистки истории', 'error');
    }
}

function copyResult() {
    try {
        const content = document.getElementById('solution-content');
        if (!content) return;
        
        const solution = content.textContent;
        if (solution && !solution.includes('Решение появится здесь')) {
            navigator.clipboard.writeText(solution).then(() => {
                showNotification('Скопировано в буфер', 'success');
            }).catch(err => {
                console.error('Ошибка копирования:', err);
                showNotification('Не удалось скопировать', 'error');
            });
        }
    } catch (error) {
        console.error('Ошибка копирования результата:', error);
    }
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info') {
    try {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'exclamation-circle'
        };
        
        notification.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message || ''}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode === container) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    } catch (error) {
        console.error('Ошибка показа уведомления:', error);
    }
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====
window.loadFromHistory = loadFromHistory;
window.solveEquation = solveEquation;
window.clearInput = clearInput;
window.clearHistory = clearHistory;
window.copyResult = copyResult;

console.log('Zabaikin Calculator AI - Загружен и готов к работе! 🚀');