using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Domain.Services
{
    public class TestAnswerService : ITestAnswerService
    {
        private readonly ITestAnswerRepository _testAnswerRepository;

        public TestAnswerService(ITestAnswerRepository testAnswerRepository)
        {
            _testAnswerRepository = testAnswerRepository;
        }

        public async Task<TestAnswer> CreateTestAnswerAsync(TestAnswer testAnswer)
        {
            return await _testAnswerRepository.CreateAsync(testAnswer);
        }

        public async Task<TestAnswer> GetTestAnswerByIdAsync(int answerId)
        {
            return await _testAnswerRepository.GetByIdAsync(answerId);
        }

        public async Task<IEnumerable<TestAnswer>> GetAllTestAnswersAsync()
        {
            return await _testAnswerRepository.GetAllAsync();
        }

        public async Task<TestAnswer> UpdateTestAnswerAsync(TestAnswer testAnswer)
        {
            return await _testAnswerRepository.UpdateAsync(testAnswer);
        }

        public async Task<bool> DeleteTestAnswerAsync(int answerId)
        {
            return await _testAnswerRepository.DeleteAsync(answerId);
        }

        public async Task SaveChangesAsync()
        {
            await _testAnswerRepository.SaveChangesAsync();
        }
    }
}
