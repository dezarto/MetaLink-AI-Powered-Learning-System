namespace MetaLink.Application.Requests
{
    public class SaveProgressRequest
    {
        public int StudentId { get; set; }
        public int GameId { get; set; }
        public string ProgressData { get; set; }
    }
}
