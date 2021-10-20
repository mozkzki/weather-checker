from weather_checker.index import handler


class TestIndex:
    def test_handler(self) -> None:
        result = handler(None, None)
        print(result)
