import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./line_chart.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";




const MyLineChart = ({ temps }) => {
    console.log("Dados recebidos para o gráfico:", temps);

    // Garantir que date está em timestamp numérico
    const formattedTemps = temps.map(temp => ({
        ...temp,
        date: new Date(temp.date).getTime() // Converte para timestamp numérico
    }));

    return (
        <Container className="line_container d-flex flex-column align-items-center">
            <Row className="title-container w-100 text-center">
                <h2 className="temp_gauge_inst">History Temperature</h2>
            </Row>
            <Row className="row_line_chart d-flex align-items-center justify-content-center">
                <ResponsiveContainer className="resp">
                    <LineChart className="line_chart" data={formattedTemps} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date"
                            domain={["auto", "auto"]} // Garante que a escala é automática
                            tickFormatter={(timestamp) => new Date(timestamp).toLocaleString("pt-PT", {
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                            })}
                            type="number" // Define como eixo numérico
                        />
                        <YAxis />
                        <Tooltip 
                            labelFormatter={(timestamp) => 
                                `Data: ${new Date(timestamp).toLocaleString("pt-PT", {
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}`
                            }
                        />
                        <Line type="monotone" dataKey="firstValue" stroke="#8884d8" strokeWidth={1} />
                    </LineChart>
                </ResponsiveContainer>
            </Row>
        </Container>
    );
};

export default MyLineChart;
