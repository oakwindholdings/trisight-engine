export const patchListTemplatesToEmpty = () => {
  jest.doMock('../../../services/adminApi', () => ({
    ...jest.requireActual('../../../services/adminApi'),
    listTemplates: jest.fn(async () => ([]))
  }));
};

