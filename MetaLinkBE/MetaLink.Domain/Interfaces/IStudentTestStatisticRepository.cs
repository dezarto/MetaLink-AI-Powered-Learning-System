using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IStudentTestStatisticRepository
    {
        Task<List<StudentTestStatistic>> GetStatisticByStudentAsync(int studentId);
        Task<IEnumerable<StudentTestStatistic>> GetAllStatisticAsync();
        Task<StudentTestStatistic> CreateStatisticAsync(StudentTestStatistic statistic);
        Task<StudentTestStatistic> UpdateStatisticAsync(StudentTestStatistic statistic);
        Task<bool> DeleteStatisticAsync(int statisticId);
        Task<IEnumerable<StudentTestStatistic>> GetBySubLessonIdAsync(int subLessonId);
        Task<IEnumerable<StudentTestStatistic>> GetBySubLessonQuizIdAsync(int subLessonId);
    }
}
