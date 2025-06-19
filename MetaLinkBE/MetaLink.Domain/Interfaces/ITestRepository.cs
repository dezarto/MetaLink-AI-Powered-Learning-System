using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ITestRepository
    {
        Task<Test> CreateAsync(Test test);
        Task<Test> GetByIdAsync(int testId);
        Task<IEnumerable<Test>> GetAllAsync();
        Task<Test> UpdateAsync(Test test);
        Task<bool> DeleteAsync(int testId);
        Task SaveChangesAsync();
    }
}
