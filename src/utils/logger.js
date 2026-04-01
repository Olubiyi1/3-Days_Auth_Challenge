import {createLogger,format,transports,addColors} from "winston"

addColors({
  info:"blue",
  warn:"yellow",
  error:"red",
  debug:"gray"
})


export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize({all:true}),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
     format.printf((info)=>{return `${info.timestamp} [${info.level.toUpperCase()}] [${info.label}] ${info.message}`}),
  ),
  transports: [
    new transports.Console()
  ],
  exitOnError: false
});