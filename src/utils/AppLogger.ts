import winston from "winston";
import path from "path";
import fs from "fs";
import { getGlobalEnvConfig } from "../models/environment/GlobalEnvConfig";

let mainLogger: winston.Logger | null = null;

type LoggerConfig = {
  logFolderPath: string;
  workerId?: string;
};

// Format error object with stack trace
const formatError = (error: Error): string => {
  let stackTrace = "";

  if (error.stack) {
    // Split the stack trace into lines and format each line
    stackTrace = error.stack
      .split("\n")
      .map((line, index) => {
        // Skip the first line as it's the error message
        if (index === 0) return "";
        // Add proper indentation to each line
        return `    ${line.trim()}`;
      })
      .filter((line) => line) // Remove empty lines
      .join("\n");
  }

  return `\n    Message: ${error.message}${
    stackTrace ? `\n    Stack:\n${stackTrace}` : ""
  }`;
};

export const initializeLoggers = ({ logFolderPath }: LoggerConfig) => {
  const globalConfig = getGlobalEnvConfig();

  // Create log folder if it doesn't exist and LOG_TO_FILE is true
  if (globalConfig.LOG_TO_FILE && !fs.existsSync(logFolderPath)) {
    fs.mkdirSync(logFolderPath, { recursive: true });
  }

  mainLogger = createLogger(logFolderPath, `trade_main.txt`);
  return { mainLogger, logFolderPath };
};

const createLogger = (logFolderPath: string, filename: string) => {
  const globalConfig = getGlobalEnvConfig();
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ];

  // Add file transport only if LOG_TO_FILE is true
  if (globalConfig.LOG_TO_FILE) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logFolderPath, filename),
        format: logFormat,
      })
    );
  }

  return winston.createLogger({
    level: "info",
    format: logFormat,
    transports,
  });
};

export const getMainLogger = () => {
  if (!mainLogger) {
    throw new Error("Logger not initialized. Call initializeLoggers() first.");
  }
  return mainLogger;
};

export const createWorkerLogger = ({
  logFolderPath,
  workerId,
}: LoggerConfig) => {
  const filename = `trade_worker_${workerId}.txt`;
  return createLogger(logFolderPath, filename);
};

// Shared log format configuration
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Handle error objects in meta
    const metaString = Object.keys(meta).length
      ? Object.entries(meta)
          .map(([key, value]) => {
            if (value instanceof Error) {
              return `${key}:${formatError(value)}`;
            }
            return `${key}: ${JSON.stringify(value)}`;
          })
          .join("\n")
      : "";

    return `${timestamp} [${level}]: ${message}${
      metaString ? `\n${metaString}` : ""
    }`;
  })
);

// Console-specific format (adds colors)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  logFormat
);
