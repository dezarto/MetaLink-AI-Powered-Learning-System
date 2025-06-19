using Microsoft.EntityFrameworkCore;
using Metalink.Domain.Entities;
using MetaLink.Domain.Entities;

namespace Metalink.Infrastructure.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<SubLesson> SubLessons { get; set; }
        public DbSet<StudentCourse> StudentCourses { get; set; }
        public DbSet<StudentLesson> StudentLessons { get; set; }
        public DbSet<StudentSubLesson> StudentSubLessons { get; set; }
        public DbSet<Avatar> Avatars { get; set; }
        public DbSet<Test> Tests { get; set; }
        public DbSet<TestQuestion> TestQuestions { get; set; }
        public DbSet<TestQuestionOption> TestQuestionOptions { get; set; }
        public DbSet<TestAnswer> TestAnswers { get; set; }
        public DbSet<StudentTestStatistic> StudentTestStatistics { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<QuizAnswer> QuizAnswers { get; set; }
        public DbSet<QuizQuestion> QuizQuestions { get; set; }
        public DbSet<QuizQuestionOption> QuizQuestionOptions { get; set; }
        public DbSet<CourseProgress> CourseProgresses { get; set; }
        public DbSet<LessonProgress> LessonProgresses { get; set; }
        public DbSet<SubLessonProgress> SubLessonProgresses { get; set; }
        public DbSet<LearningStyleAnswer> LearningStyleAnswers { get; set; }
        public DbSet<LearningStyleCategory> LearningStyleCategories { get; set; }
        public DbSet<LearningStyleQuestion> LearningStyleQuestions { get; set; }
        public DbSet<AiPrompt> AiPrompts { get; set; }
        public DbSet<AIGeneratedContent> AIGeneratedContents { get; set; }
        public DbSet<CompanyProfile> CompanyProfiles { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<StudentFriendship> StudentFriendships { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<GameProgress> GameProgress { get; set; }
        public DbSet<XPRecord> XPRecords { get; set; }
        public DbSet<Game> Games { get; set; }
        public DbSet<GameInvite> GameInvites { get; set; }
        public DbSet<StudentReport> StudentReports { get; set; }
        public DbSet<ReviewSession> ReviewSessions { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

           // modelBuilder.Entity<StudentAvatar>()
           //.HasKey(studentAvatar => new { studentAvatar.StudentID, studentAvatar.AvatarID});
        }
    }
}
