import { AIModel } from './types';
import philosopher from './philosopher';
import scientist from './scientist';
import politician from './politician';
import chairperson from './chairperson';
import referee from './referee';
import beijingworker from './beijingworker';
import shenzhenworker from './shenzhenworker';

// 所有可用的AI模型
export const aiModels: AIModel[] = [
  philosopher,
  scientist,
  politician,
  beijingworker,
  shenzhenworker,
];

// 主席AI模型
export const chairModel: AIModel = chairperson;

// 裁判AI模型
export const refereeModel: AIModel = referee;

// 根据ID获取AI模型
export function getModelById(id: string): AIModel | undefined {
  return aiModels.find(model => model.id === id);
}

// 导出类型
export type { AIModel, DebateMessage, DebateSession } from './types'; 