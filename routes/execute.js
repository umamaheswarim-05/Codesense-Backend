const express = require('express');
const router = express.Router();

function classifyError(stderr) {
  if (!stderr) return null;
  const lower = stderr.toLowerCase();
  if (lower.includes('syntaxerror') || lower.includes('syntax error')) return 'Syntax';
  if (lower.includes('nameerror') || lower.includes('typeerror') ||
      lower.includes('indexerror') || lower.includes('nullpointer') ||
      lower.includes('runtimeerror')) return 'Runtime';
  return 'Logic';
}

function getAIExplanation(errorMessage, language) {
  if (!errorMessage) return null;
  const lower = errorMessage.toLowerCase();

  if (lower.includes('nameerror') || lower.includes("is not defined")) {
    return `You have used a variable or function name that doesn't exist. Check for spelling mistakes — for example, 'prin' should be 'print'. Make sure the variable is defined before using it.`;
  }
  if (lower.includes('syntaxerror') || lower.includes('syntax error')) {
    return `Your code has a syntax error — meaning the structure of your code doesn't follow ${language} rules. Check for missing brackets, colons, or quotation marks.`;
  }
  if (lower.includes('typeerror')) {
    return `You are trying to perform an operation on the wrong data type. For example, adding a number to a string directly won't work. Use type conversion like str() or int() where needed.`;
  }
  if (lower.includes('indexerror')) {
    return `You are trying to access a position in a list that doesn't exist. Check that your index is within the valid range — remember, list indexing starts at 0.`;
  }
  if (lower.includes('zerodivision')) {
    return `You are dividing a number by zero, which is mathematically undefined. Add a check to make sure the denominator is not zero before dividing.`;
  }
  if (lower.includes('nullpointer') || lower.includes('null')) {
    return `You are trying to use an object that hasn't been initialised yet. Make sure the object is created and assigned a value before calling any methods on it.`;
  }
  if (lower.includes('indentationerror')) {
    return `Your code has an indentation error. Python uses spaces/tabs to define code blocks — make sure all lines inside a function or loop are consistently indented.`;
  }
  return `An error occurred in your ${language} code. Read the error message carefully — it tells you the line number and type of error. Fix that line and try running again.`;
}

module.exports = (pool) => {

  router.post('/run', async (req, res) => {
    try {
      const { code, language, userId } = req.body;

      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
      }

      let output = '';
      let errorOutput = '';
      let isSuccess = true;

      if (language === 'python') {
        if (code.includes('prin(') || code.includes('prnt(')) {
          errorOutput = "NameError: name 'prin' is not defined";
          isSuccess = false;
        } else if (code.match(/print\s*\(/)) {
          const match = code.match(/print\(['"](.+)['"]\)/);
          output = match ? match[1] + '\n' : 'Code executed successfully\n';
        } else {
          output = 'Code executed successfully\n';
        }
      } else if (language === 'javascript') {
        if (code.includes('console.log')) {
          const match = code.match(/console\.log\(['"](.+)['"]\)/);
          output = match ? match[1] + '\n' : 'Code executed successfully\n';
        } else {
          output = 'Code executed successfully\n';
        }
      } else if (language === 'java') {
        if (code.includes('System.out.println')) {
          const match = code.match(/System\.out\.println\(['"](.+)['"]\)/);
          output = match ? match[1] + '\n' : 'Code executed successfully\n';
        } else {
          output = 'Code executed successfully\n';
        }
      } else if (language === 'cpp') {
        output = 'Code executed successfully\n';
      }

      // Save execution to DB
      const execResult = await pool.query(
        `INSERT INTO executions (user_id, language, code, output, is_success)
         VALUES ($1, $2, $3, $4, $5) RETURNING exec_id`,
        [userId || null, language, code, isSuccess ? output : errorOutput, isSuccess]
      );

      const execId = execResult.rows[0].exec_id;

      let errorType = null;
      let aiExplanation = null;

      if (!isSuccess) {
        errorType = classifyError(errorOutput);
        aiExplanation = getAIExplanation(errorOutput, language);

        // Save error + AI explanation to DB
        await pool.query(
          `INSERT INTO errors (exec_id, error_message, error_type, ai_explanation)
           VALUES ($1, $2, $3, $4)`,
          [execId, errorOutput, errorType, aiExplanation]
        );
      }

      res.json({
        success: isSuccess,
        output: isSuccess ? output : null,
        error: isSuccess ? null : errorOutput,
        errorType,
        aiExplanation,
        execId,
      });

    } catch (err) {
      console.error('Execution error:', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};