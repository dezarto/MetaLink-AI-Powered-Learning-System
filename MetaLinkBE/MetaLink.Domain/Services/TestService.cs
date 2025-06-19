using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class TestService : ITestService
    {
        private readonly ITestRepository _testRepository;

        public TestService(ITestRepository testRepository)
        {
            _testRepository = testRepository;
        }

        public async Task<Test> CreateTestAsync(Test test)
        {
            var createdTest = await _testRepository.CreateAsync(test);
            await _testRepository.SaveChangesAsync();

            return createdTest;
        }

        public async Task<Test> GetTestByIdAsync(int testId)
        {
            return await _testRepository.GetByIdAsync(testId);
        }

        public async Task<IEnumerable<Test>> GetAllTestAsync()
        {
            return await _testRepository.GetAllAsync();
        }

        public async Task<Test> UpdateTestAsync(Test test)
        {
            return await _testRepository.UpdateAsync(test);
        }

        public async Task<bool> DeleteTestAsync(int testId)
        {
            return await _testRepository.DeleteAsync(testId);
        }

        public async Task SaveChangesAsync()
        {
            await _testRepository.SaveChangesAsync();
        }
    }
}
