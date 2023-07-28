#include <Wire.h>
#include <MPU9250_WE.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>    
#include <HTTPClient.h>
#include <UrlEncode.h>

//flex settings
#define thumbpin 32
#define indexpin 35
#define middlepin 34
#define ringpin 39
#define pinkypin 36

//Display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET     -1 
#define SCREEN_ADDRESS 0x3C 
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

//gyro settings
#define MPU9250_ADDR 0x68
MPU9250_WE myMPU9250 = MPU9250_WE(MPU9250_ADDR);

//Notification system settings
const char* ssid = "JioFiber-Pathayam";
const char* password = "pathayam2024";
String phoneNumber = "918156853991";
String apiKey = "2121873";

//send notification function
void sendMessage(String message){

  String url = "https://api.callmebot.com/whatsapp.php?phone=" + phoneNumber + "&apikey=" + apiKey + "&text=" + urlEncode(message);     
  HTTPClient http;
  http.begin(url);

  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  int httpResponseCode = http.POST(url);
  if (httpResponseCode == 200){
    Serial.println("Message sent successfully");
  }
  else{
    Serial.println("Error sending the message");
    Serial.print("HTTP response code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  
  //gyro initialization
  Wire.begin();
  if(!myMPU9250.init()){
    Serial.println("MPU9250 does not respond");
  }
  else{
    Serial.println("MPU9250 is connected");
  }
  Serial.println("Position you MPU9250 flat and don't move it - calibrating...");
  delay(1000);
  myMPU9250.autoOffsets();
  Serial.println("Done!");
  myMPU9250.setSampleRateDivider(5);
  myMPU9250.setAccRange(MPU9250_ACC_RANGE_2G);
  myMPU9250.enableAccDLPF(true);
  myMPU9250.setAccDLPF(MPU9250_DLPF_6);

  //display initialization
  display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS);
  display.clearDisplay();
  

  //notiification initialization
  WiFi.begin(ssid, password);
  Serial.println("Connecting");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());

  //pin init
  pinMode(32, INPUT);
  pinMode(34, INPUT);
  pinMode(35, INPUT);
  pinMode(39, INPUT);
  pinMode(36, INPUT);
}

int thumb[2], indes[2], middle[2], ring[2], pinky[2];
bool scanned=false, sent=true;

void loop() {  
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0,0); 
  
  Serial.println("start"); 
  xyzFloat angles = myMPU9250.getAngles(); 
  //hand down state
  if (angles.x<50){
  thumb[0]=analogRead(thumbpin);
  indes[0]=analogRead(indexpin);
  middle[0]=analogRead(middlepin);  
  ring[0]=analogRead(ringpin);
  pinky[0]=analogRead(pinkypin);
  scanned=true;}
  //hand up state
  if (angles.x>50){
  thumb[1]=analogRead(thumbpin);
  indes[1]=analogRead(indexpin);
  middle[1]=analogRead(middlepin);  
  ring[1]=analogRead(ringpin);
  pinky[1]=analogRead(pinkypin);
  sent=false;}  
  //thumb
  Serial.print("thumb: ");
  int thumbdiff=thumb[0]-thumb[1];
  Serial.println(thumbdiff);
  display.print("THUMB: ");
  display.println(thumbdiff);
  //index
  Serial.print("index: ");
  int indexdiff=indes[0]-indes[1];
  Serial.println(indexdiff);
  display.print("INDEX: ");
  display.println(indexdiff);
  //middle
  Serial.print("middle: ");
  int middlediff=middle[0]-middle[1];
  Serial.println(middlediff);
  display.print("MIDDLE:");
  display.println(middlediff);
  //ring
  Serial.print("ring: ");
  int ringdiff=ring[0]-ring[1];
  Serial.println(ringdiff);
  display.print("RING:  ");
  display.println(ringdiff);
  //pinky
  Serial.print("pinky: ");
  int pinkydiff=pinky[0]-pinky[1];
  Serial.println(pinkydiff);
  display.print("PINKY: ");
  display.println(pinkydiff);
  //angles  
  display.println("angles (x,y,z): ");
  display.print(angles.x);
  display.print(",");
  display.print(angles.y);
  display.print(",");
  display.println(angles.z);
  display.display();

  if(scanned==true){
    thumb[1]=0;
    indes[1]=0;
    middle[1]=0;
    ring[1]=0;
    pinky[1]=0;  
    scanned=false;  
  }
  if(sent==false && thumbdiff>15 && indexdiff<15 && middlediff<15 && ringdiff<15 && pinkydiff<15){
    Serial.println("ok");
    sendMessage("ok");
    sent=true;
    delay(2000);  
  } 
  if(sent==false && thumbdiff<15 && indexdiff>15 && middlediff<15 && ringdiff<15 && pinkydiff<15){
    Serial.println("no");  
    sendMessage("no");  
    sent=true;
    delay(2000); 
  } 
  if(sent==false && thumbdiff<15 && indexdiff<15 && middlediff>15 && ringdiff<15 && pinkydiff<15){
    Serial.println("food"); 
    sendMessage("food");   
    sent=true;
    delay(2000); 
  }    
  if(sent==false && thumbdiff<5 && indexdiff<5 && middlediff<5 && ringdiff>5 && pinkydiff<5){
    Serial.println("pain");
    sendMessage("pain");
    sent=true;
    delay(2000);  
  }  
  if(sent==false && thumbdiff<5 && indexdiff<5 && middlediff<5 && ringdiff<5 && pinkydiff>5){
    Serial.println("water"); 
    sendMessage("water");
    sent=true;
    delay(2000); 
  }  
  delay(2000);
}
