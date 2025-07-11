import {ChatGroq} from "@langchain/groq"
import {ChatPromptTemplate} from "@langchain/core/prompts"
import {Document} from "@langchain/core/documents"
import {createStuffDocumentsChain} from "langchain/chains/combine_documents"

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY || "",
    model: "llama-3.1-70b-instruct",
})


const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the user's question. 
        Context: {context}
        Question: {input}
    `)

// const chain = prompt.pipe(model)
const chain = await createStuffDocumentsChain({
    llm: model,
    prompt,
})

const doc = new Document({
    pageContent: "The capital of France is Paris.",
    metadata: {source: "example"},
})

const response = await chain.invoke({
    context: [doc],
    input: "What is the capital of France?"
})

