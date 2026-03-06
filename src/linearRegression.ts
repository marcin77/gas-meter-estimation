// Multiple Linear Regression using Normal Equation: β = (XᵀX)⁻¹Xᵀy
// Seedable pseudo-random for deterministic train/test split

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function trainTestSplit(
  X: number[][],
  y: number[],
  testSize: number,
  randomState: number
) {
  const n = X.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  const rng = seededRandom(randomState);

  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const testCount = Math.round(n * testSize);
  const testIndices = indices.slice(0, testCount);
  const trainIndices = indices.slice(testCount);

  return {
    X_train: trainIndices.map((i) => X[i]),
    X_test: testIndices.map((i) => X[i]),
    y_train: trainIndices.map((i) => y[i]),
    y_test: testIndices.map((i) => y[i]),
  };
}

function transpose(m: number[][]): number[][] {
  const rows = m.length,
    cols = m[0].length;
  const t: number[][] = Array.from({ length: cols }, () => new Array(rows));
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) t[j][i] = m[i][j];
  return t;
}

function matMul(a: number[][], b: number[][]): number[][] {
  const rows = a.length,
    cols = b[0].length,
    inner = b.length;
  const r: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(0)
  );
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      for (let k = 0; k < inner; k++) r[i][j] += a[i][k] * b[k][j];
  return r;
}

function invertMatrix(m: number[][]): number[][] {
  const n = m.length;
  const aug: number[][] = m.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++)
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

    const pivot = aug[i][i];
    if (Math.abs(pivot) < 1e-12) throw new Error("Singular matrix");
    for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;

    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = aug[k][i];
      for (let j = 0; j < 2 * n; j++) aug[k][j] -= factor * aug[i][j];
    }
  }

  return aug.map((row) => row.slice(n));
}

export interface ModelResult {
  intercept: number;
  coefficients: number[];
  trainR2: number;
  testR2: number;
  mae: number;
  rmse: number;
  predictions: number[];
  allPredictions: { index: number; predicted: number }[];
}

function predict(X: number[][], intercept: number, coefs: number[]): number[] {
  return X.map((row) =>
    intercept + row.reduce((sum, val, i) => sum + val * coefs[i], 0)
  );
}

function r2Score(yTrue: number[], yPred: number[]): number {
  const mean = yTrue.reduce((a, b) => a + b, 0) / yTrue.length;
  const ssTot = yTrue.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = yTrue.reduce((s, v, i) => s + (v - yPred[i]) ** 2, 0);
  return 1 - ssRes / ssTot;
}

export function fitLinearRegression(
  X_all: number[][],
  y_all: number[],
  testSize: number,
  randomState: number
): ModelResult {
  const { X_train, X_test, y_train, y_test } = trainTestSplit(
    X_all,
    y_all,
    testSize,
    randomState
  );

  // Add intercept column (column of 1s)
  const X_train_aug = X_train.map((r) => [1, ...r]);

  const Xt = transpose(X_train_aug);
  const XtX = matMul(Xt, X_train_aug);
  const XtX_inv = invertMatrix(XtX);
  const y_col = y_train.map((v) => [v]);
  const Xty = matMul(Xt, y_col);
  const beta = matMul(XtX_inv, Xty).map((r) => r[0]);

  const intercept = beta[0];
  const coefficients = beta.slice(1);

  const trainPred = predict(X_train, intercept, coefficients);
  const testPred = predict(X_test, intercept, coefficients);

  const trainR2 = r2Score(y_train, trainPred);
  const testR2 = r2Score(y_test, testPred);

  const mae =
    y_test.reduce((s, v, i) => s + Math.abs(v - testPred[i]), 0) /
    y_test.length;
  const mse =
    y_test.reduce((s, v, i) => s + (v - testPred[i]) ** 2, 0) /
    y_test.length;
  const rmse = Math.sqrt(mse);

  const allPred = predict(X_all, intercept, coefficients);
  const allPredictions = allPred.map((p, i) => ({ index: i, predicted: p }));

  return {
    intercept,
    coefficients,
    trainR2,
    testR2,
    mae,
    rmse,
    predictions: testPred,
    allPredictions,
  };
}
