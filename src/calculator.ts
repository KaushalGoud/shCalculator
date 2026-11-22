export type Operator = '+' | '−' | 'x' | '÷';

export type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operator'; value: Operator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'sign' }
  | { type: 'percent' };

export type CalculatorState = {
  display: string;
  expression: string;
  showResult: boolean;
  waitingForNewInput: boolean;
  hasError: boolean;
};

export const initialCalculatorState: CalculatorState = {
  display: '0',
  expression: '',
  showResult: false,
  waitingForNewInput: false,
  hasError: false,
};

export function normalizeCalculatorState(
  state?: Partial<CalculatorState> | null,
): CalculatorState {
  return {
    display: (state?.display ?? initialCalculatorState.display).replace(/,/g, ''),
    expression: (state?.expression ?? initialCalculatorState.expression).replace(/[\s,]/g, ''),
    showResult: state?.showResult ?? initialCalculatorState.showResult,
    waitingForNewInput:
      state?.waitingForNewInput ?? initialCalculatorState.waitingForNewInput,
    hasError: state?.hasError ?? initialCalculatorState.hasError,
  };
}

const MAX_INPUT_LENGTH = 12;
const ERROR_MESSAGE = 'Error';

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: Operator };

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function isOperator(char: string): char is Operator {
  return char === '+' || char === '−' || char === 'x' || char === '÷';
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return ERROR_MESSAGE;
  }

  const rounded = Number(value.toPrecision(12));

  if (Object.is(rounded, -0)) {
    return '0';
  }

  const absolute = Math.abs(rounded);

  if (absolute !== 0 && (absolute >= 1e12 || absolute < 1e-9)) {
    return rounded
      .toExponential(6)
      .replace(/\.?0+e/, 'e')
      .replace('e+', 'e');
  }

  return String(rounded);
}

function tokenize(expression: string): Token[] | null {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression.charAt(index);

    if (isOperator(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    if (char === '-' || char === '.' || isDigit(char)) {
      const start = index;

      if (char === '-') {
        index += 1;
      }

      let hasDigit = false;

      while (index < expression.length) {
        const current = expression.charAt(index);

        if (isDigit(current)) {
          hasDigit = true;
        } else if (current !== '.') {
          break;
        }

        index += 1;
      }

      const text = expression.slice(start, index);

      if (!hasDigit || text === '.' || text === '-.' || text === '-') {
        return null;
      }

      const value = Number(text);

      if (!Number.isFinite(value)) {
        return null;
      }

      tokens.push({ type: 'number', value });
      continue;
    }

    return null;
  }

  return tokens;
}

function evaluateExpression(expression: string): number {
  const tokens = tokenize(expression);

  if (!tokens || tokens.length === 0) {
    return Number.NaN;
  }

  let position = 0;

  function peek(): Token | undefined {
    return tokens?.[position];
  }

  function next(): Token | undefined {
    const token = tokens?.[position];
    position += 1;
    return token;
  }

  function parseNumber(): number {
    const token = next();

    if (!token || token.type !== 'number') {
      return Number.NaN;
    }

    return token.value;
  }

  function parseTerm(): number {
    let value = parseNumber();

    while (Number.isFinite(value)) {
      const token = peek();

      if (!token || token.type !== 'operator' || (token.value !== 'x' && token.value !== '÷')) {
        break;
      }

      next();
      const right = parseNumber();

      if (!Number.isFinite(right)) {
        return Number.NaN;
      }

      if (token.value === 'x') {
        value *= right;
      } else {
        if (right === 0) {
          return Number.NaN;
        }

        value /= right;
      }
    }

    return value;
  }

  function parseSum(): number {
    let value = parseTerm();

    while (Number.isFinite(value)) {
      const token = peek();

      if (!token || token.type !== 'operator' || (token.value !== '+' && token.value !== '−')) {
        break;
      }

      next();
      const right = parseTerm();

      if (!Number.isFinite(right)) {
        return Number.NaN;
      }

      value = token.value === '+' ? value + right : value - right;
    }

    return value;
  }

  const result = parseSum();

  if (position !== tokens.length || !Number.isFinite(result)) {
    return Number.NaN;
  }

  return result;
}

function operatorBeforeCurrentInput(state: CalculatorState): Operator | null {
  const prefixLength = state.expression.length - state.display.length;
  const char = state.expression.charAt(prefixLength - 1);
  return isOperator(char) ? char : null;
}

function getLastOperation(expression: string): { operator: Operator; operand: string } | null {
  for (let index = expression.length - 1; index >= 0; index -= 1) {
    const char = expression.charAt(index);

    if (isOperator(char)) {
      const operand = expression.slice(index + 1);
      return operand ? { operator: char, operand } : null;
    }
  }

  return null;
}

function startNewInput(display: string): CalculatorState {
  return { ...initialCalculatorState, display, expression: display };
}

function replaceCurrentInput(state: CalculatorState, display: string): string {
  const prefixLength = state.expression.length - state.display.length;

  if (prefixLength <= 0) {
    return display;
  }

  return state.expression.slice(0, prefixLength) + display;
}

function errorState(): CalculatorState {
  return {
    ...initialCalculatorState,
    display: ERROR_MESSAGE,
    hasError: true,
    waitingForNewInput: true,
  };
}

function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.hasError || state.showResult) {
    return startNewInput(digit);
  }

  if (state.waitingForNewInput) {
    return {
      ...state,
      display: digit,
      expression: state.expression + digit,
      waitingForNewInput: false,
    };
  }

  if (state.display === '0') {
    return { ...state, display: digit, expression: replaceCurrentInput(state, digit) };
  }

  if (state.display === '-0') {
    const display = `-${digit}`;
    return { ...state, display, expression: replaceCurrentInput(state, display) };
  }

  const currentLength = state.display.replace('-', '').replace('.', '').length;

  if (currentLength >= MAX_INPUT_LENGTH) {
    return state;
  }

  const display = state.display + digit;
  return { ...state, display, expression: state.expression + digit };
}

function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.hasError || state.showResult) {
    return startNewInput('0.');
  }

  if (state.waitingForNewInput) {
    return {
      ...state,
      display: '0.',
      expression: state.expression + '0.',
      waitingForNewInput: false,
    };
  }

  if (state.display.includes('.')) {
    return state;
  }

  const display = `${state.display}.`;
  return { ...state, display, expression: state.expression + '.' };
}

function selectOperator(state: CalculatorState, operator: Operator): CalculatorState {
  if (state.hasError) {
    return initialCalculatorState;
  }

  let expression = state.expression;

  if (state.showResult) {
    expression = state.display;
  } else if (state.waitingForNewInput) {
    expression = expression.replace(/[+\-−x÷]$/, '');
  }

  if (!expression) {
    expression = state.display;
  }

  return {
    ...state,
    expression: expression + operator,
    showResult: false,
    waitingForNewInput: true,
  };
}

function equals(state: CalculatorState): CalculatorState {
  if (state.hasError) {
    return state;
  }

  let expression = state.expression;

  if (state.showResult && state.waitingForNewInput) {
    const lastOperation = getLastOperation(expression);

    if (lastOperation) {
      expression = `${state.display}${lastOperation.operator}${lastOperation.operand}`;
    }
  } else if (state.waitingForNewInput && isOperator(expression.charAt(expression.length - 1))) {
    expression += state.display;
  }

  if (!expression) {
    expression = state.display;
  }

  const result = evaluateExpression(expression);

  if (!Number.isFinite(result)) {
    return errorState();
  }

  return {
    ...state,
    display: formatNumber(result),
    expression,
    showResult: true,
    waitingForNewInput: true,
  };
}

function backspace(state: CalculatorState): CalculatorState {
  if (state.hasError) {
    return initialCalculatorState;
  }

  if (state.showResult) {
    const display = state.display.slice(0, -1) || '0';

    return {
      ...state,
      display,
      expression: display === '0' ? '' : display,
      showResult: false,
      waitingForNewInput: false,
    };
  }

  if (state.waitingForNewInput && isOperator(state.expression.charAt(state.expression.length - 1))) {
    return {
      ...state,
      expression: state.expression.slice(0, -1),
      waitingForNewInput: false,
    };
  }

  let display = state.display.slice(0, -1);

  if (display === '' || display === '-' || display === '-0') {
    display = '0';
  }

  return {
    ...state,
    display,
    expression: replaceCurrentInput(state, display),
    waitingForNewInput: false,
  };
}

function toggleSign(state: CalculatorState): CalculatorState {
  if (state.hasError) {
    return initialCalculatorState;
  }

  if (state.waitingForNewInput && isOperator(state.expression.charAt(state.expression.length - 1))) {
    const display = '-0';

    return {
      ...state,
      display,
      expression: state.expression + display,
      showResult: false,
      waitingForNewInput: false,
    };
  }

  const display = state.display.startsWith('-')
    ? state.display.slice(1)
    : `-${state.display}`;

  return {
    ...state,
    display,
    expression: state.showResult ? display : replaceCurrentInput(state, display),
    showResult: false,
    waitingForNewInput: false,
  };
}

function percent(state: CalculatorState): CalculatorState {
  if (state.hasError) {
    return initialCalculatorState;
  }

  const current = Number(state.display);

  if (!Number.isFinite(current)) {
    return errorState();
  }

  const prefixLength = state.expression.length - state.display.length;
  const prefix = state.showResult ? '' : state.expression.slice(0, prefixLength);
  const pendingOperator = state.showResult ? null : operatorBeforeCurrentInput(state);
  let value = current / 100;

  if (pendingOperator === '+' || pendingOperator === '−') {
    const left = evaluateExpression(prefix.slice(0, -1));

    if (Number.isFinite(left)) {
      value *= left;
    }
  }

  const display = formatNumber(value);

  return {
    ...state,
    display,
    expression: state.showResult ? display : prefix + display,
    showResult: false,
    waitingForNewInput: false,
  };
}

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  const current = normalizeCalculatorState(state);

  switch (action.type) {
    case 'digit':
      return inputDigit(current, action.value);
    case 'decimal':
      return inputDecimal(current);
    case 'operator':
      return selectOperator(current, action.value);
    case 'equals':
      return equals(current);
    case 'clear':
      return initialCalculatorState;
    case 'backspace':
      return backspace(current);
    case 'sign':
      return toggleSign(current);
    case 'percent':
      return percent(current);
  }
}
