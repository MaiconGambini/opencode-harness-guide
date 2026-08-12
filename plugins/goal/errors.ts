export class GoalPluginError extends Error {
  public readonly code: string

  public constructor(code: string, message: string) {
    super(message)
    this.name = "GoalPluginError"
    this.code = code
  }
}

export function userError(message: string): GoalPluginError {
  return new GoalPluginError("GOAL_USER_ERROR", message)
}

export function stateError(message: string): GoalPluginError {
  return new GoalPluginError("GOAL_STATE_ERROR", message)
}
