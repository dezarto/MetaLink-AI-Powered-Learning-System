using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class TestQuestionService : ITestQuestionService
    {
        private readonly ITestQuestionRepository _testQuestionRepository;

        public TestQuestionService(ITestQuestionRepository testQuestionRepository)
        {
            _testQuestionRepository = testQuestionRepository;
        }

        public async Task<TestQuestion> CreateTestQuestionAsync(TestQuestion testQuestion)
        {
            var createdTestQuestion = await _testQuestionRepository.CreateAsync(testQuestion);
            await _testQuestionRepository.SaveChangesAsync();

            return createdTestQuestion;
        }

        public async Task<TestQuestion> GetTestQuestionByIdAsync(int questionId)
        {
            return await _testQuestionRepository.GetByIdAsync(questionId);
        }

        public async Task<IEnumerable<TestQuestion>> GetAllTestQuestionsAsync()
        {
            return await _testQuestionRepository.GetAllAsync();
        }

        public async Task<TestQuestion> UpdateTestQuestionAsync(TestQuestion testQuestion)
        {
            return await _testQuestionRepository.UpdateAsync(testQuestion);
        }

        public async Task<bool> DeleteTestQuestionAsync(int questionId)
        {
            return await _testQuestionRepository.DeleteAsync(questionId);
        }

        public async Task SaveChangesAsync()
        {
            await _testQuestionRepository.SaveChangesAsync();
        }
    }
}
