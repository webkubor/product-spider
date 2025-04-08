import chalk from 'chalk';

// 控制台输出样式
export const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ ') + chalk.blue(msg)),
  success: (msg) => console.log(chalk.green('✅ ') + chalk.green(msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️ ') + chalk.yellow(msg)),
  error: (msg) => console.error(chalk.red('❌ ') + chalk.red(msg)),
  title: (msg) => console.log('\n' + chalk.bold.cyan('🔍 ' + msg) + '\n' + chalk.cyan('='.repeat(50)))
};
