# Maestro smoke scenarios

```yaml
appId: ru.moyvklad.app
---
- launchApp
- assertVisible: "Создадим семейный план"
- tapOn: "Девочка"
- tapOn: "5–6 лет"
- tapOn: "PIN взрослого (4 цифры)"
- inputText: "1234"
- tapOn: "Начать"
- assertVisible: "На сегодня"
- tapOn: "Положить одежду в корзину"
- tapOn: "Сделала сама"
- assertVisible: "опыта"
```
