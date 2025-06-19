using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ITestQuestionService
    {
        Task<TestQuestion> CreateTestQuestionAsync(TestQuestion testQuestion);
        Task<TestQuestion> GetTestQuestionByIdAsync(int questionId);
        Task<IEnumerable<TestQuestion>> GetAllTestQuestionsAsync();
        Task<TestQuestion> UpdateTestQuestionAsync(TestQuestion testQuestion);
        Task<bool> DeleteTestQuestionAsync(int questionId);
        Task SaveChangesAsync();
    }
}
