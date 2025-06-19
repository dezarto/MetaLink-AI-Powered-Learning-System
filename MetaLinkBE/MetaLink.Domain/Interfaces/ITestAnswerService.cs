using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ITestAnswerService
    {
        Task<TestAnswer> CreateTestAnswerAsync(TestAnswer testAnswer);
        Task<TestAnswer> GetTestAnswerByIdAsync(int answerId);
        Task<IEnumerable<TestAnswer>> GetAllTestAnswersAsync();
        Task<TestAnswer> UpdateTestAnswerAsync(TestAnswer testAnswer);
        Task<bool> DeleteTestAnswerAsync(int answerId);
        Task SaveChangesAsync();
    }
}
