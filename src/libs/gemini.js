const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiHandler {
    constructor() {
        this.genAI = new GoogleGenerativeAI({
            api
        })
    }
}