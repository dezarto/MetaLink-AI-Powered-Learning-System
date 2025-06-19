using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ITestAnswerRepository
    {
        Task<TestAnswer> CreateAsync(TestAnswer testAnswer);
        Task<TestAnswer> GetByIdAsync(int testAnswerId);
        Task<IEnumerable<TestAnswer>> GetAllAsync();
        Task<TestAnswer> UpdateAsync(TestAnswer testAnswer);
        Task<bool> DeleteAsync(int testAnswerId);
        Task SaveChangesAsync();
    }
}
