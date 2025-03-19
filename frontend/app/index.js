import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Alert
} from "react-native";

export default function App() {
  const [snmpData, setSnmpData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // FastAPI 서버 주소 (PC IP로 변경 필요)
  const API_URL = "http://localhost:8000/snmp/multi";

  const fetchSNMPData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("서버 응답에 문제가 있습니다.");
      }
      const data = await response.json();
      if (data.results) {
        setSnmpData(data.results);
      } else {
        setError("결과 데이터가 올바르지 않습니다.");
      }
    } catch (err) {
      setError(err.message);
      Alert.alert("오류", err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.row}>
        <Text style={styles.cell}>{item.oid}</Text>
        <Text style={styles.cell}>{item.value || ""}</Text>
        <Text style={[styles.cell, { color: "red" }]}>
          {item.error || ""}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cisco 라우터 SNMP 정보</Text>

      <TouchableOpacity style={styles.button} onPress={fetchSNMPData}>
        <Text style={styles.buttonText}>데이터 가져오기</Text>
      </TouchableOpacity>

      {loading && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 10 }}>데이터를 불러오는 중...</Text>
        </View>
      )}

      {error && (
        <Text style={{ color: "red", marginTop: 10 }}>
          오류: {error}
        </Text>
      )}

      {/* 데이터 표시 */}
      {!loading && !error && snmpData.length > 0 && (
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerText]}>OID</Text>
            <Text style={[styles.cell, styles.headerText]}>Value</Text>
            <Text style={[styles.cell, styles.headerText]}>Error</Text>
          </View>
          <FlatList
            data={snmpData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",   // 가로 정렬
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginVertical: 20,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  table: {
    marginTop: 20,
    width: "100%",
  },
  headerRow: {
    backgroundColor: "#eee",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  headerText: {
    fontWeight: "bold",
  },
  cell: {
    flex: 1,
    padding: 8,
  },
});
