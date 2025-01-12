using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.RegularExpressions;


namespace BackendGermanSmartDetector.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        public ImportController(IConfiguration configuration, IWebHostEnvironment env)
        {
            _configuration = configuration;
            _env = env;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] IFormFile video, [FromForm] IFormFile areas)
        {
            if (video == null || areas == null)
            {
                return BadRequest("Оба файла (видео и JSON) должны быть переданы.");
            }

            string jsonContent;
            using (var stream = areas.OpenReadStream())
            using (var reader = new StreamReader(stream))
            {
                jsonContent = await reader.ReadToEndAsync();
            }

            try
            {
                jsonContent = jsonContent.Replace("\"orx\"", "\"x\"").Replace("\"ory\"", "\"y\"");
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка обработки JSON: {ex.Message}");
            }

            List<Area> formattedAreas;
            try
            {
                formattedAreas = JsonConvert.DeserializeObject<List<Area>>(jsonContent);
            }
            catch (JsonException ex)
            {
                return BadRequest($"Ошибка десериализации JSON: {ex.Message}");
            }

            string videoPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp", Path.GetRandomFileName() + Path.GetExtension(video.FileName));
            string jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp", Path.GetRandomFileName() + ".json");
            string outputVideoPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp", Path.GetRandomFileName() + Path.GetExtension(video.FileName));
            string outputCsvPath = Path.Combine(Directory.GetCurrentDirectory(), "Temp", "Report" + ".xlsx");
            string modelPath = Path.Combine(Directory.GetCurrentDirectory(), "YoloModel", "detector_yolov10s.pt");

            try
            {
                using (var stream = new FileStream(videoPath, FileMode.Create))
                {
                    await video.CopyToAsync(stream);
                }

                await System.IO.File.WriteAllTextAsync(jsonPath, jsonContent);

                string pythonScriptPath = Path.Combine(Directory.GetCurrentDirectory(), "Python", "main.py");
                string arguments = $"\"{pythonScriptPath}\" --video-path \"{videoPath}\" --model-path \"{modelPath}\" --output-path \"{outputVideoPath}\" --report-path \"{outputCsvPath}\" --regions \"{jsonPath}\"";

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = arguments,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = false
                };

                using (var process = Process.Start(processStartInfo))
                {
                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0)
                    {
                        string error = await process.StandardError.ReadToEndAsync();
                        return StatusCode(500, $"Ошибка выполнения Python-скрипта: {error}");
                    }
                }

                string videoUrl = Url.Content($"~/Temp/{Path.GetFileName(outputVideoPath)}");
                string excelDownloadUrl = Url.Action(nameof(DownloadExcel), new { filePath = outputCsvPath });

                return Ok(new
                {
                    VideoUrl = videoUrl,
                    ExcelDownloadUrl = excelDownloadUrl
                });
            }
            finally
            {

            }
        }

        [HttpGet("download-excel")]
        public async Task<IActionResult> DownloadExcel([FromQuery] string filePath)
        {
            int index = filePath.IndexOf('?');

            if (index >= 0) // Если знак ? найден
            {
                filePath = filePath.Substring(0, index); // Обрезаем до знака ?
            }

            filePath = filePath.Replace("?", "");

            if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath))
            {
                return NotFound("Файл не найден.");
            }

            byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            string fileName = Path.GetFileName(filePath);

            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        public class Area
        {
            public int AreaNumber { get; set; }
            public List<Coordinate> Coordinates { get; set; }
        }

        public class Coordinate
        {
            public double X { get; set; }
            public double Y { get; set; }
        }

        public class MultipartResponse
        {
            public string VideoUrl { get; set; } 
            public string ExcelDownloadUrl { get; set; }  
        }
    }
}
