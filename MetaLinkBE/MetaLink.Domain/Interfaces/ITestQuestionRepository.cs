using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ITestQuestionRepository
    {
        Task<TestQuestion> CreateAsync(TestQuestion testQuestion);
        Task<TestQuestion> GetByIdAsync(int questionId);
        Task<IEnumerable<TestQuestion>> GetAllAsync();
        Task<TestQuestion> UpdateAsync(TestQuestion testQuestion);
        Task<bool> DeleteAsync(int questionId);
        Task SaveChangesAsync();
    }
}
