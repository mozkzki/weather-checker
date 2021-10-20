import json
import os
import sys
import traceback

import moz_image as image
import requests
from PIL import Image
from selenium.webdriver import Chrome, ChromeOptions
from selenium.webdriver.remote.webelement import WebElement

THRESHOLD = 40
YAHOO_URL = "https://weather.yahoo.co.jp/weather/jp/13/4410.html"


def handler(event, context):
    task_root = _check_env("LAMBDA_TASK_ROOT", is_check=False)
    home = _check_env("HOME", is_check=False)
    _check_env("CHROME_BINARY_LOCATION")
    _check_env("CHROME_DRIVER_LOCATION")
    _check_env("gyazo_access_token")
    _check_env("SLACK_POST_URL")
    _check_env("SLACK_POST_CHANNEL")
    _check_env("LINE_POST_URL")

    os.system(f"ls -al {task_root}")
    os.system(f"ls -al {home}")

    # Chromedriver生成
    driver = _create_driver()

    # 降水確率取得
    percent = _get_rainy_percent(driver)
    if percent > THRESHOLD:
        # 閾値を超えたらお天気画面キャプチャ
        screenshot_url = _get_yahoo_weather_screenshot(driver)
        message = "今日は雨が降りそうです。\n  12-18時の降水確率: {}％".format(percent)
        # 通知
        _post_to_line(screenshot_url, message)
        _post_to_slack(message)

    # Chromedriver破棄
    driver.quit()

    return {"statusCode": 200, "body": "ok"}


def _check_env(key: str, is_check: bool = True) -> str:
    value = os.environ.get(key, "")
    if is_check:
        if not value:
            print(f"Not found environment variable: ({key} = {value})")
            sys.exit(1)
    print(f"env | {key}: {value}")
    return value


def _create_driver():
    options = ChromeOptions()
    options.binary_location = os.environ.get("CHROME_BINARY_LOCATION")

    # 基本
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--single-process")
    # ログ関連
    options.add_argument("--enable-logging")
    options.add_argument("--v=99")
    # その他
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--allow-running-insecure-content")
    options.add_argument("--disable-web-security")
    options.add_argument("--disable-desktop-notifications")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-dev-tools")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-application-cache")
    options.add_argument("--start-maximized")
    options.add_argument("--no-zygote")
    options.add_argument("--hide-scrollbars")
    options.add_argument("--dns-prefetch-disable")
    options.add_argument("--user-data-dir=/tmp/chrome-user-data")
    options.add_argument("--lang=ja")
    # UA
    user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36"  # noqa E501
    options.add_argument("--user-agent=" + user_agent)

    # options.add_argument('--window-size=1280x1696')
    # options.add_argument('--log-level=0')
    # options.add_argument('--remote-debugging-port=9222')
    # options.add_argument("--disable-setuid-sandbox")
    # options.page_load_strategy = 'none'

    driver = Chrome(options=options, executable_path=os.environ.get("CHROME_DRIVER_LOCATION"))
    driver.set_window_size(1280, 720)
    driver.set_page_load_timeout(30)

    return driver


def _get_yahoo_weather_screenshot(driver) -> str:
    try:
        # 何故かYahoo天気のページはgetがtimeoutする(他のページは正常)
        # timeoutしても遷移&screenshot撮影は成功するので例外補足して進む
        screenshot_path = _screenshot(
            driver,
            YAHOO_URL,
            "//div[@class='forecastCity']/table/tbody/tr/td/div",
        )
    except Exception:
        traceback.print_exc()

    # GYAZOにアップロード
    screenshot_url = image.upload_to_gyazo(screenshot_path)
    return screenshot_url


def _get_rainy_percent(driver) -> int:
    rainy_percent_text = _get_text_from_web_page(
        driver,
        YAHOO_URL,
        "//div[@class='forecastCity']/table/tbody/tr/td/div/table/tbody/tr[2]/td[3]",
    )
    # 実行時刻によってはデータが取得できない。その場合、0%とみなす
    percent_text = rainy_percent_text.replace("---", "0％")
    return int(percent_text.replace("％", ""))


def _screenshot(driver, url: str, xpath: str) -> str:
    # ページ遷移
    driver.get(url)
    # 要素取得
    element: WebElement = driver.find_element_by_xpath(xpath)

    # 「element.screenshot_as_png」は、古いchromeだと実装されていないようで下記のようなエラーになる
    # Message: unknown command: session/..../element/..../screenshot
    # png = element.screenshot_as_png
    # with open(out_file, "wb") as f:
    #     f.write(png)

    # 代替の方法で実施

    # まずフルスクリーンで取得
    full_screenshot_path = "/tmp/screenshot_full.png"
    driver.get_screenshot_as_file(full_screenshot_path)
    # HTML要素のサイズに合わせて画像を切り取る
    left = int(element.location["x"])
    top = int(element.location["y"])
    right = int(element.location["x"] + element.size["width"])
    bottom = int(element.location["y"] + element.size["height"])
    im = Image.open(full_screenshot_path)
    im = im.crop((left, top, right, bottom))
    # 切り取った画像を保存
    screenshot_path = "/tmp/screenshot.png"
    im.save(screenshot_path)
    return screenshot_path


def _get_text_from_web_page(driver, url: str, xpath: str):
    driver.get(url)
    return driver.find_element_by_xpath(xpath).text


def _post_to_slack(message: str) -> None:
    slack_post_url = os.environ["SLACK_POST_URL"]
    slack_channel = os.environ["SLACK_POST_CHANNEL"]

    slack_message = {
        "message": message,
        "color": "good",
        "channel": slack_channel,
    }

    try:
        requests.post(slack_post_url, data=json.dumps(slack_message))
        print("message posted to {}.".format(slack_message["channel"]))
    except requests.exceptions.RequestException as e:
        print("request failed: {}".format(e))


def _post_to_line(image_url: str, description: str) -> None:
    title = "今日の天気"
    line_message = {
        "line_message": {
            "type": "template",
            "altText": title,
            "template": {
                "type": "buttons",
                "thumbnailImageUrl": image_url,
                "imageAspectRatio": "rectangle",
                "imageSize": "contain",
                "imageBackgroundColor": "#FFFFFF",
                "title": title,
                "text": description,
                "actions": [
                    {
                        "type": "uri",
                        "label": "Yahoo天気へ",
                        "uri": "https://weather.yahoo.co.jp/weather/jp/13/4410.html",
                    }
                ],
            },
        }
    }

    try:
        requests.post(os.environ["LINE_POST_URL"], data=json.dumps(line_message))
        print("line message posted.")
    except requests.exceptions.RequestException as e:
        print("Request failed: {}".format(e))
