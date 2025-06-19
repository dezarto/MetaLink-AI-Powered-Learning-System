using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ITestService
    {
        Task<Test> CreateTestAsync(Test test);
        Task<Test> GetTestByIdAsync(int testId);
        Task<IEnumerable<Test>> GetAllTestAsync();
        Task<Test> UpdateTestAsync(Test test);
        Task<bool> DeleteTestAsync(int testId);
        Task SaveChangesAsync();
    }
}
