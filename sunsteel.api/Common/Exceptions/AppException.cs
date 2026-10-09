namespace sunsteel.api.Common.Exceptions;

/// <summary>
/// A handled application error, mapped to an HTTP status by
/// <see cref="Middleware.ExceptionHandlingMiddleware"/> (defaults to 400).
/// </summary>
public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = StatusCodes.Status400BadRequest)
        : base(message) => StatusCode = statusCode;
}
