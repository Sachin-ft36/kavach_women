export type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isVerbose: boolean = true;

  public setVerbose(verbose: boolean) {
    this.isVerbose = verbose;
  }

  public debug(tag: string, message: string, data?: any) {
    if (!this.isVerbose) return;
    console.debug(`[KAVACH AI][DEBUG][${tag}] ${message}`, data || "");
  }

  public info(tag: string, message: string, data?: any) {
    console.info(`[KAVACH AI][INFO][${tag}] ${message}`, data || "");
  }

  public warn(tag: string, message: string, data?: any) {
    console.warn(`[KAVACH AI][WARN][${tag}] ${message}`, data || "");
  }

  public error(tag: string, message: string, error?: any) {
    console.error(`[KAVACH AI][ERROR][${tag}] ${message}`, error || "");
  }
}

export const logger = new Logger();
