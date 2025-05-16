import React, { useState, useEffect } from 'react';
import { Table, Card, Tag } from 'antd';
import axios from '../utils/axios';

const TransactionLog = () => {
    const [transactions, setTransactions] = useState([]);
    
    const columns = [
        {
            title: 'Time',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (timestamp) => new Date(timestamp).toLocaleString()
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={type === 'BUY' ? 'green' : 'red'}>
                    {type}
                </Tag>
            )
        },
        {
            title: 'Token',
            dataIndex: 'token',
            key: 'token',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => amount.toFixed(4)
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${price.toFixed(4)}`
        },
        {
            title: 'DEX',
            dataIndex: 'dex',
            key: 'dex',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'SUCCESS' ? 'green' : 'red'}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Tx Hash',
            dataIndex: 'txHash',
            key: 'txHash',
            render: (hash) => (
                <a href={`https://solscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer">
                    {`${hash.substr(0, 6)}...${hash.substr(-4)}`}
                </a>
            )
        }
    ];

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get('/api/trading/transactions');
                setTransactions(response.data);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };

        fetchTransactions();
        const interval = setInterval(fetchTransactions, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <Card title="Transaction Log">
            <Table 
                dataSource={transactions} 
                columns={columns} 
                pagination={{ pageSize: 10 }}
                rowKey="txHash"
            />
        </Card>
    );
};

export default TransactionLog; 