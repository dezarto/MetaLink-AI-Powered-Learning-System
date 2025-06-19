using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ITestQuestionOptionRepository
    {
        Task<TestQuestionOption> CreateAsync(TestQuestionOption testQuestionOption);
        Task<TestQuestionOption> GetByIdAsync(int optionId);
        Task<IEnumerable<TestQuestionOption>> GetAllAsync();
        Task<TestQuestionOption> UpdateAsync(TestQuestionOption testQuestionOption);
        Task<bool> DeleteAsync(int optionId);
        Task SaveChangesAsync();
    }
}
