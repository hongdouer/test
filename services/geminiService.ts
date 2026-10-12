
import { GoogleGenAI, Type } from "@google/genai";
import { Enterprise, MatchingResult, Methodology, GreenStatus, Loan, RatingResult, RatingModelConfig } from "../types";

// Helper to get API key safely
const getApiKey = () => process.env.API_KEY || '';

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Parses raw policy text to extract metadata using Gemini.
 */
export const parseMethodologyText = async (text: string): Promise<{
  name?: string;
  summary?: string;
  suggestedType?: string;
}> => {
  const apiKey = getApiKey();
  if (!apiKey) return {};

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the following Green Finance policy text and extract metadata.
      Text: "${text.substring(0, 2000)}..." (truncated for brevity)`,
      config: {
        systemInstruction: "You are an expert in Green Finance policy analysis. Extract the policy type, applicable stages, and applicable roles based on the text.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A suitable title for this policy if not provided" },
            summary: { type: Type.STRING, description: "A brief summary of the policy rules" },
            suggestedType: { type: Type.STRING, enum: ["国家政策", "地方政策", "银行规则"] },
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return {};
  }
};

/**
 * Auto-completes enterprise information based on a company name.
 */
export const autoCompleteEnterpriseInfo = async (name: string): Promise<Partial<Enterprise>> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Fallback mock if no API key
    return {
      creditCode: "91330106MA27W81H9G",
      industry: "C3990 - 其他电子设备制造",
      registeredCapital: "5000万人民币",
      businessScope: "研发、生产、销售：环保设备、电子产品；技术服务。",
      legalRepresentative: "张三",
      registrationStatus: "存续",
      foundingDate: "2020-01-01",
      address: "浙江省杭州市...",
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate realistic mock business registration details (Chinese Gongshang Info) for a Chinese company named "${name}". Return ample details.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            creditCode: { type: Type.STRING, description: "Unified Social Credit Code (18 digits)" },
            industry: { type: Type.STRING, description: "GB/T 4754 Industry Classification" },
            registeredCapital: { type: Type.STRING },
            businessScope: { type: Type.STRING, description: "A realistic business scope description" },
            legalRepresentative: { type: Type.STRING, description: "Name of legal representative" },
            foundingDate: { type: Type.STRING, description: "YYYY-MM-DD" },
            registrationStatus: { type: Type.STRING, description: "e.g. 在营, 存续" },
            address: { type: Type.STRING },
            phoneNumber: { type: Type.STRING },
            email: { type: Type.STRING },
            website: { type: Type.STRING },
            organizationCode: { type: Type.STRING },
            taxpayerType: { type: Type.STRING, description: "e.g. 一般纳税人" },
            staffSize: { type: Type.STRING, description: "e.g. 小于50人" },
            businessTerm: { type: Type.STRING, description: "e.g. 2000-01-01 至 无固定期限" },
            registrationAuthority: { type: Type.STRING },
            region: { type: Type.STRING },
            introduction: { type: Type.STRING, description: "A brief company introduction" },
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Auto-complete Error:", error);
    return {};
  }
};

/**
 * Runs the Green Credit Matching logic for a specific LOAN.
 */
export const runGreenMatching = async (
  loan: Loan,
  enterprise: Enterprise,
  methodologies: Methodology[],
  context?: {
    stage?: string;
    role?: string;
  }
): Promise<MatchingResult> => {
  const apiKey = getApiKey();
  
  const activeRole = context?.role || '通用审核员';
  const activeStage = context?.stage || '通用阶段';
  const contextStr = `[岗位: ${activeRole} @ 阶段: ${activeStage}]`;

  if (!apiKey) {
    // Fallback mock
    return {
      status: GreenStatus.DOUBTFUL,
      confidence: 75,
      summary: `${contextStr} 经系统自动分析，该项目... (Mock Result)`,
      details: [
          {
              ruleName: methodologies[0]?.name || '未知规则',
              isMatched: false,
              reason: 'Mock result fallback',
              conditions: [],
              missingDocs: [],
              matchedItems: [],
              nearMatches: []
          }
      ],
      suggestions: ["建议补充材料"],
      generatedAt: new Date().toISOString(),
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Serialize rules
    const rulesText = methodologies.map((m, index) => {
      const catalogText = m.catalogItems 
        ? JSON.stringify(m.catalogItems.map(item => ({
            code: item.code,
            category: item.category,
            name: item.name,
            conditions: item.conditions // Pass conditions explicitly
          }))) 
        : m.content.substring(0, 1000);

      return `--- Rule ID ${index + 1}: ${m.name} ---\nType: ${m.type}\nCatalog/Conditions: ${catalogText}`;
    }).join('\n');

    const prompt = `
      Act as a **${activeRole}** within a commercial bank.
      Analysis Context: Green Finance Compliance Check during **${activeStage}**.
      
      Loan Project: ${loan.projectName || 'Unnamed Project'}, Amount: ${loan.amount}万, Use: "${loan.useOfFunds}"
      Enterprise: ${enterprise.name}, Industry: ${enterprise.industry}, Scope: ${enterprise.businessScope}
      Docs: ${enterprise.documents?.map(d => d.name).join(', ')}

      Rules:
      ${rulesText}

      Task: Analyze the LOAN's "Use of Funds" against rules. Return JSON.
      
      Specific Instructions:
      1. **Standard/Technical Requirements**: For 'matchedItems.standard', you MUST copy the exact text from the 'conditions' field of the matched catalog item provided in the rules. Do not summarize or paraphrase. If there are multiple conditions, list them.
      2. **Evidence**: For every matched catalog item, you MUST provide 'evidence'. Cite specific document names (e.g. "Feasibility Report") or specific information strings (e.g. "Project Name contains 'Solar'") that supports the match.
      3. **Near Matches**: Identify catalog items that are relevant or close to the project nature but do not fully meet criteria or lack evidence. For these, provide a 'gap' analysis explaining what condition is missing or what document is needed.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["绿色", "存疑", "非绿"] },
            confidence: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            details: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ruleName: { type: Type.STRING },
                  isMatched: { type: Type.BOOLEAN },
                  matchedItems: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            code: { type: Type.STRING },
                            category: { type: Type.STRING },
                            name: { type: Type.STRING },
                            standard: { type: Type.STRING, description: "Exact text from the catalog 'conditions' field." },
                            evidence: { type: Type.STRING, description: "Specific document or info used for determination" }
                        }
                    }
                  },
                  nearMatches: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            code: { type: Type.STRING },
                            category: { type: Type.STRING },
                            name: { type: Type.STRING },
                            gap: { type: Type.STRING, description: "What is missing or why it failed" }
                        }
                    }
                  },
                  reason: { type: Type.STRING },
                  conditions: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              requirement: { type: Type.STRING },
                              status: { type: Type.STRING, enum: ["pass", "fail", "unknown"] },
                              detail: { type: Type.STRING }
                          }
                      }
                  },
                  missingDocs: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return { ...result, generatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Gemini Matching Error:", error);
    throw error;
  }
};

/**
 * Runs the Enterprise ESG/Green Rating logic.
 */
export const runGreenRating = async (
    enterprise: Enterprise,
    ratingConfig: RatingModelConfig,
    modelName: string
): Promise<RatingResult> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        // Fallback mock
        return {
            totalScore: 78,
            level: "GE2",
            levelName: "中绿企业",
            summary: "企业整体绿色表现良好，但在环境信息披露和能源体系认证方面有待加强。",
            qualitative: [
                { item: "绿色产业符合性", passed: true, analysis: "主营业务属于光伏制造，符合目录要求。", evidence: "营业执照-经营范围" },
                { item: "环境合规", passed: true, analysis: "近一年无行政处罚记录。", evidence: "企业信用报告" }
            ],
            quantitative: [
                { level1: "绿色效益", level2: "绿色营收占比", maxScore: 10, actualScore: 8, analysis: "占比约45%，得分8分。", evidence: "2023年度审计报告" },
                { level1: "能源效率", level2: "能耗下降率", maxScore: 20, actualScore: 12, analysis: "提供了能耗报表，显示同比下降2%，未达标杆水平。", missingInfo: "能效对标报告", evidence: "能源管理报表" }
            ],
            bonus: [],
            suggestions: ["建议开展能源管理体系认证", "完善年度社会责任报告披露"],
            generatedAt: new Date().toISOString()
        };
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const prompt = `
            Act as an ESG Rating Analyst.
            Conduct a Green Rating assessment for the following enterprise using the provided Rating Model.

            **Enterprise Info:**
            Name: ${enterprise.name}
            Industry: ${enterprise.industry}
            Business Scope: ${enterprise.businessScope}
            Intro: ${enterprise.introduction}
            Documents Provided: ${enterprise.documents?.map(d => `${d.name} (${d.tag}: ${d.summary})`).join(', ')}
            Activities: ${enterprise.activities?.map(a => a.description).join('; ')}

            **Rating Model Configuration:**
            Qualitative Indicators (Pass/Fail): ${JSON.stringify(ratingConfig.qualitative)}
            Quantitative Indicators (Scoring): ${JSON.stringify(ratingConfig.quantitative)}
            Bonus Indicators: ${JSON.stringify(ratingConfig.bonus)}
            Level Definitions: ${JSON.stringify(ratingConfig.levels)}

            **Instructions:**
            1. Evaluate Qualitative items first. If enterprise fails any, note it.
            2. Score Quantitative items. Based on provided docs/info, estimate a score. 
               - If evidence is clear, give full/partial score based on standard.
               - If NO evidence is found for a specific indicator, score it 0 and mark 'missingInfo'.
            3. **CRITICAL**: For EVERY score, populate the 'evidence' field. Cite the specific document name, or "Business Scope", "Credit Report", etc. If inferred, state "Inferred from X".
            4. Sum up scores (Quantitative + Bonus).
            5. Assign a Level based on the Levels definition.
            6. Provide suggestions for items with 0 or low scores.

            Return JSON matching the schema.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        totalScore: { type: Type.NUMBER },
                        level: { type: Type.STRING, description: "e.g. GE1" },
                        levelName: { type: Type.STRING, description: "e.g. 深绿企业" },
                        summary: { type: Type.STRING },
                        qualitative: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    item: { type: Type.STRING },
                                    passed: { type: Type.BOOLEAN },
                                    analysis: { type: Type.STRING },
                                    evidence: { type: Type.STRING, description: "Specific document or data source"}
                                }
                            }
                        },
                        quantitative: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    level1: { type: Type.STRING },
                                    level2: { type: Type.STRING },
                                    maxScore: { type: Type.NUMBER },
                                    actualScore: { type: Type.NUMBER },
                                    analysis: { type: Type.STRING, description: "Reason for the score" },
                                    evidence: { type: Type.STRING, description: "Specific document or data source"},
                                    missingInfo: { type: Type.STRING, description: "What document is needed to get full score? Empty if full score." }
                                }
                            }
                        },
                        bonus: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    level1: { type: Type.STRING },
                                    level2: { type: Type.STRING },
                                    maxScore: { type: Type.NUMBER },
                                    actualScore: { type: Type.NUMBER },
                                    analysis: { type: Type.STRING },
                                    evidence: { type: Type.STRING },
                                    missingInfo: { type: Type.STRING }
                                }
                            }
                        },
                        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    }
                }
            }
        });

        const result = JSON.parse(response.text || '{}');
        return { ...result, generatedAt: new Date().toISOString() };

    } catch (error) {
        console.error("Gemini Rating Error:", error);
        throw error;
    }
};
