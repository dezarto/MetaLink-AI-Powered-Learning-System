using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ITestQuestionOptionService
    {
        Task<TestQuestionOption> CreateTestQuestionOptionAsync(TestQuestionOption testQuestionOption);
        Task<TestQuestionOption> GetTestQuestionOptionByIdAsync(int optionId);
        Task<IEnumerable<TestQuestionOption>> GetAllTestQuestionOptionsAsync();
        Task<TestQuestionOption> UpdateTestQuestionOptionAsync(TestQuestionOption testQuestionOption);
        Task<bool> DeleteTestQuestionOptionAsync(int optionId);
        Task SaveChangesAsync();
    }
}
