import { AIModel } from './types';
import philosopher from './philosopher';
import scientist from './scientist';
import politician from './politician';
import chairperson from './chairperson';

// 所有可用的AI模型
export const aiModels: AIModel[] = [
  philosopher,
  scientist,
  politician
];

// 主席AI模型
export const chairModel: AIModel = chairperson;

// 根据ID获取AI模型
export function getModelById(id: string): AIModel | undefined {
  return aiModels.find(model => model.id === id);
}

// 导出类型
export type { AIModel, DebateMessage, DebateSession } from './types'; 