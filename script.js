const display = document.getElementById("display");
const message = document.getElementById("message");
const angleMode = document.getElementById("angleMode");
let answer = 0;

function insert(value) {
  if (display.value === "Error") display.value = "";
  display.value += value;
  message.textContent = "";
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) {
    throw new Error("Factorial requires an integer from 0 to 170.");
  }
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function toRadians(value) {
  return angleMode.checked ? value * Math.PI / 180 : value;
}

// Convert calculator notation to a restricted mathematical expression.
// No eval() or Function() is used.
function tokenizeExpression(source) {
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const rest = source.slice(i);
    if (/^\s+/.test(rest)) {
      i += rest.match(/^\s+/)[0].length;
      continue;
    }

    const number = rest.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if (number) {
      tokens.push({ type: "number", value: Number(number[0]) });
      i += number[0].length;
      continue;
    }

    const identifier = rest.match(/^[a-zA-Z]+/);
    if (identifier) {
      const name = identifier[0].toLowerCase();
      if (name === "pi") tokens.push({ type: "number", value: Math.PI });
      else if (name === "e") tokens.push({ type: "number", value: Math.E });
      else if (name === "ans") tokens.push({ type: "number", value: answer });
      else if (["sin", "cos", "tan", "sqrt", "log", "ln", "abs", "exp"].includes(name)) {
        tokens.push({ type: "function", value: name });
      } else {
        throw new Error("Unknown function: " + name);
      }
      i += identifier[0].length;
      continue;
    }

    if ("+-*/^()%!".includes(source[i])) {
      tokens.push({ type: "symbol", value: source[i] });
      i++;
      continue;
    }

    throw new Error("Invalid character: " + source[i]);
  }
  return tokens;
}

function evaluate(source) {
  const tokens = tokenizeExpression(source);
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];

  function parseExpression() {
    let value = parseTerm();
    while (peek() && (peek().value === "+" || peek().value === "-")) {
      const op = take().value;
      const right = parseTerm();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  function parseTerm() {
    let value = parseUnary();
    while (peek() && ["*", "/", "%"].includes(peek().value)) {
      const op = take().value;
      const right = parseUnary();
      if (op === "*") value *= right;
      if (op === "/") value /= right;
      if (op === "%") value %= right;
    }
    return value;
  }

  function parseUnary() {
    if (peek() && peek().value === "+") { take(); return parseUnary(); }
    if (peek() && peek().value === "-") { take(); return -parseUnary(); }
    return parsePower();
  }

  function parsePower() {
    let value = parsePostfix();
    if (peek() && peek().value === "^") {
      take();
      value = Math.pow(value, parseUnary());
    }
    return value;
  }

  function parsePostfix() {
    let value = parsePrimary();
    while (peek() && peek().value === "!") {
      take();
      value = factorial(value);
    }
    return value;
  }

  function parsePrimary() {
    const token = take();
    if (!token) throw new Error("Incomplete expression.");

    if (token.type === "number") return token.value;

    if (token.value === "(") {
      const value = parseExpression();
      if (!peek() || take().value !== ")") throw new Error("Missing closing parenthesis.");
      return value;
    }

    if (token.type === "function") {
      if (!peek() || take().value !== "(") throw new Error("Use parentheses after a function.");
      const input = parseExpression();
      if (!peek() || take().value !== ")") throw new Error("Missing closing parenthesis.");
      switch (token.value) {
        case "sin": return Math.sin(toRadians(input));
        case "cos": return Math.cos(toRadians(input));
        case "tan": return Math.tan(toRadians(input));
        case "sqrt":
          if (input < 0) throw new Error("Square root of a negative number is not real.");
          return Math.sqrt(input);
        case "log":
          if (input <= 0) throw new Error("log requires a positive number.");
          return Math.log10(input);
        case "ln":
          if (input <= 0) throw new Error("ln requires a positive number.");
          return Math.log(input);
        case "abs": return Math.abs(input);
        case "exp": return Math.exp(input);
      }
    }
    throw new Error("Check your expression.");
  }

  if (tokens.length === 0) throw new Error("Enter an expression.");
  const result = parseExpression();
  if (position !== tokens.length) throw new Error("Check your expression.");
  if (!Number.isFinite(result)) throw new Error("Result is not a finite number.");
  return result;
}

function calculate() {
  try {
    const result = evaluate(display.value);
    answer = result;
    display.value = String(Number(result.toPrecision(12)));
    message.textContent = "";
  } catch (error) {
    message.textContent = error.message || "Could not calculate this expression.";
  }
}

document.querySelector(".keys").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const value = button.dataset.value;

  if (action === "clear") {
    display.value = "";
    message.textContent = "";
  } else if (action === "delete") {
    display.value = display.value === "Error" ? "" : display.value.slice(0, -1);
    message.textContent = "";
  } else if (action === "equals") {
    calculate();
  } else if (action === "sign") {
    if (display.value) display.value = "-(" + display.value + ")";
  } else if (value) {
    insert(value);
  }
});

document.addEventListener("keydown", (event) => {
  if (/^[0-9.+\-*/^()%!]$/.test(event.key)) {
    insert(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    calculate();
  } else if (event.key === "Backspace") {
    display.value = display.value.slice(0, -1);
  } else if (event.key === "Escape") {
    display.value = "";
    message.textContent = "";
  }
});
