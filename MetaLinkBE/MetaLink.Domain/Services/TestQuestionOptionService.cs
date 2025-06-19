using System.ComponentModel.DataAnnotations;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class TestQuestionOptionService : ITestQuestionOptionService
    {
        private readonly ITestQuestionOptionRepository _testQuestionOptionRepository;

        public TestQuestionOptionService(ITestQuestionOptionRepository testQuestionOptionRepository)
        {
            _testQuestionOptionRepository = testQuestionOptionRepository;
        }

        public async Task<TestQuestionOption> CreateTestQuestionOptionAsync(TestQuestionOption testQuestionOption)
        {
            var createdQuestionOption = await _testQuestionOptionRepository.CreateAsync(testQuestionOption);
            await _testQuestionOptionRepository.SaveChangesAsync();

            return createdQuestionOption;
        }

        public async Task<TestQuestionOption> GetTestQuestionOptionByIdAsync(int optionId)
        {
            return await _testQuestionOptionRepository.GetByIdAsync(optionId);
        }

        public async Task<IEnumerable<TestQuestionOption>> GetAllTestQuestionOptionsAsync()
        {
            return await _testQuestionOptionRepository.GetAllAsync();
        }

        public async Task<TestQuestionOption> UpdateTestQuestionOptionAsync(TestQuestionOption testQuestionOption)
        {
            return await _testQuestionOptionRepository.UpdateAsync(testQuestionOption);
        }

        public async Task<bool> DeleteTestQuestionOptionAsync(int optionId)
        {
            return await _testQuestionOptionRepository.DeleteAsync(optionId);
        }

        public async Task SaveChangesAsync()
        {
            await _testQuestionOptionRepository.SaveChangesAsync();
        }
    }
}
