const express = require("express");
const router = express.Router();
const fs = require("fs");
const { analyzeImage } = require("./utils");
const path = require("path");
// const {Jimp} = require("jimp");

router.post("/calculate", async (req, res) => {
  try {
    const { image, dict_of_vars } = req.body;

    const base64Data = image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Define a unique temporary file path
    const tempFilePath = path.join(__dirname, `temp_image_${Date.now()}.png`);

    // Write the decoded image to a temporary file
    await fs.promises.writeFile(tempFilePath, imageBuffer);

    // Analyze the image (replace this with your custom function)
    const responses = await analyzeImage(tempFilePath, dict_of_vars);

    // Delete the temporary file after analysis is complete
    await fs.promises.unlink(tempFilePath);


    const data = responses.map((response) => response);

    console.log("response in route:", responses);

    res.json({ message: "Image processed", data, status: "success" });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ message: "Image processing failed", error });
  }
});

module.exports = router;
