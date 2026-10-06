export type ErrorPolicyAction =
  | 'redirect-login'
  | 'not-participant'
  | 'backoff-toast'
  | 'refetch-feedback'
  | `violation:${string}`
  | 'unknown-error';

type ErrorData = {
  code?: unknown;
  ruleViolation?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorData(error: unknown): ErrorData | null {
  if (!isRecord(error) || !isRecord(error.data)) return null;
  return error.data;
}

export function mapTRPCErrorToPolicy(error: unknown): ErrorPolicyAction {
  const data = getErrorData(error);
  const code = typeof data?.code === 'string' ? data.code : null;
  const ruleViolation = isRecord(data?.ruleViolation)
    ? data.ruleViolation
    : null;
  const ruleViolationCode =
    typeof ruleViolation?.code === 'string' ? ruleViolation.code : null;

  if (code === 'BAD_REQUEST' && ruleViolationCode) {
    return `violation:${ruleViolationCode}`;
  }

  switch (code) {
    case 'UNAUTHORIZED':
      return 'redirect-login';
    case 'FORBIDDEN':
      return 'not-participant';
    case 'TOO_MANY_REQUESTS':
      return 'backoff-toast';
    case 'CONFLICT':
      return 'refetch-feedback';
    default:
      return 'unknown-error';
  }
}
