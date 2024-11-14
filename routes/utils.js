const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs"); // for reading images if needed
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genai = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

async function analyzeImage(imgPath, dictOfVars) {
  try {
    // Read image as binary data and encode it in base64
    const imageBuffer = fs.readFileSync(imgPath);

    const img = {
      inlineData: {
        data: Buffer.from(imageBuffer).toString("base64"),
        mimeType: "image/png",
      },
    };

    // Prepare the prompt with user-defined variables
    const prompt = `
      You have been given an image with various types of mathematical expressions, equations, or graphical problems that you need to analyze and solve.
      Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right). Parentheses have the highest priority, followed by Exponents, then Multiplication and Division, and lastly Addition and Subtraction.

      Following are the types of problems you might encounter. Pay attention to any specified range for variables; if no range is given, solve as a general equation. Here’s how you should solve each type:

      Simple Mathematical Expressions:
      For expressions like "2 + 2", "3 * 4", "5 / 6", "7 - 8", etc.:

      Apply PEMDAS: solve Parentheses first, then Exponents, then Multiplication and Division (left to right), and finally Addition and Subtraction (left to right).
      Return format: [{"expr": "given expression", "result": "calculated answer"}].
      Set of Equations:
      For sets of equations like "x^2 + 2x + 1 = 0", "3y + 4x = 0", "5x^2 + 6y + 7 = 12":

      Use algebraic methods like substitution (solving one equation for a variable and substituting it into another) or elimination (adding or subtracting equations to eliminate a variable).
      If ranges for variables are given, apply those restrictions; otherwise, solve for general values.
      Format each solution as a COMMA-SEPARATED LIST OF DICTS: {"expr": "variable", "result": "value", "assign": true}.
      Variable Assignments:
      For assignments like "x = 4", "y = 5", "z = 6":

      Simply assign the value to each variable and return each assignment as {"expr": "variable", "result": "value", "assign": true} in a LIST OF DICTS.
      Graphical Math Problems:
      For problems represented visually (e.g., trigonometry, Pythagorean theorem, rate problems):

      Identify and interpret visual features such as labels, angles, colors, or lengths.
      Use relevant formulas based on context (e.g., Pythagorean theorem for right triangles, trigonometric identities for angle relations).
      Apply any specified ranges or conditions; if not provided, solve for the general case.
      Return in the format [{"expr": "derived expression from drawing", "result": "calculated answer"}].
      Abstract Concepts in Drawings:
      For drawings symbolizing concepts (e.g., love, patriotism, war):

      Interpret the imagery, recognizing symbols, characters, or themes that represent abstract ideas.
      Describe the interpretation and return as [{"expr": "interpretation of drawing", "result": "abstract concept"}].
      Quadratic Equations with Real Solutions:
      For quadratic equations (e.g., "x^2 - 4x + 3 = 0"):

      Arrange the equation in the standard form ax^2 + bx + c = 0.
      Use the quadratic formula: x = (-b ± √(b² - 4ac)) / (2a) to find solutions for x.
      If ranges for x are specified, apply them; if not, provide general solutions.
      Return each solution in the format {"expr": "x", "result": "value", "assign": true}.
      Quadratic Equations with Imaginary Solutions:
      For quadratic equations without real solutions (e.g., "x^2 + x + 1 = 0"):

      Use the quadratic formula and solve for x, allowing for imaginary values when b² - 4ac < 0.
      Return solutions including the imaginary part in the format {"expr": "x", "result": "solution with i", "assign": true}. Apply ranges if specified; otherwise, solve generally.
      Trigonometric Expressions:
      For expressions involving trigonometric functions (e.g., "sin(30)", "cos(45)", "tan(x)"):

      Evaluate based on standard angles if given, or apply trigonometric identities (e.g., sin²(x) + cos²(x) = 1) for unknowns.
      Use radians unless degrees are specified. If ranges (e.g., 0 ≤ x < 2π) are provided, apply them; if not, solve as a general expression.
      Return in format: [{"expr": "given expression", "result": "evaluated answer"}].
      Logarithmic Expressions:
      For logarithmic expressions (e.g., "log(10)", "ln(1)", "log_base(64, 2)"):

      Evaluate based on base 10 for log(), base e for ln(), or the specified base (e.g., "log_base(64, 2)" means log base 2 of 64).
      Use logarithmic properties like log(a) + log(b) = log(ab) or log(a) - log(b) = log(a/b) for complex expressions.
      If a range for the argument is given, apply it; otherwise, evaluate the general value.
      Return in format: [{"expr": "given expression", "result": "evaluated answer"}].
      Analyze each equation or expression in the image and return the answer according to these rules. Pay attention to any specified range for the variables; if no range is mentioned, solve as a general equation.
      Make sure to use extra backslashes for escape characters like \f -> \\f, \n -> \\n, etc.

      Here is a dictionary of user-assigned variables. If the given expression includes any of these variables, use its value from this dictionary accordingly: ${JSON.stringify(
            dictOfVars
          )}.
      DO NOT USE BACKTICKS OR MARKDOWN FORMATTING.
      PROPERLY QUOTE THE KEYS AND VALUES IN THE DICTIONARY FOR EASIER PARSING WITH JavaScript's JSON.parse.
    `;

    const result = await model.generateContent([prompt, img]);

    // console.log(result.response.text());

    const data = result.response
      .text()
      .replace(/```json/g, "") // Remove any JSON code block markers
      .replace(/```/g, "") // Remove any remaining backticks
      .trim();

    console.log(data);
    // Parse JSON response
    let answers = [];
    try {
      answers = JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse Gemini API response:", error);
    }

    // Add 'assign' key where applicable
    answers = answers.map((answer) => ({
      ...answer,
      assign: answer.assign || false,
    }));

    // console.log("Returned answer:", answers);
    return answers;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return [];
  }
}

module.exports = { analyzeImage };
